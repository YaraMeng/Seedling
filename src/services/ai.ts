import { GoogleGenAI, Type } from "@google/genai";
import { Category } from "../types";

// 修正后的代码
// const ai = new GoogleGenAI(import.meta.env.VITE_GOOGLE_AI_API_KEY || "");

const keyFromEnv = import.meta.env.VITE_GOOGLE_AI_API_KEY;

if (!keyFromEnv) {
  // 如果拿不到 Key，在页面标题上显示出来，方便我们一眼看到
  document.title = "DEBUG: Key is Missing!"; 
  console.log("环境变量内容：", import.meta.env); // 打印出所有能拿到的环境变量
}

const ai = new GoogleGenAI(keyFromEnv || "DUMMY_KEY_TO_PREVENT_CRASH");

export async function generateMetadata(input: { text?: string; file?: { mimeType: string; data: string } }, existingCategories: Category[]) {
  const categoryTree = existingCategories.map(c => ({ id: c.id, name: c.name, parentId: c.parentId }));
  const systemInstruction = `你是一个极其严谨的“知识代谢分析师”。你的任务是分析用户输入的内容，并生成结构化的元数据。

## Task
分析用户输入的 URL 内容或文本，生成结构化元数据以供入库。

## Output (JSON)
{
  "suggested_tags": ["标签1", "标签2", "标签3"], // 基于语义提取的核心词，应具体：如“交互设计”优于“设计”。
  "suggested_category_id": "string", // 基于用户现有分类树的预测 ID。如果置信度低，建议返回 null。
  "confidence_score": 0.9,
  "summary": "一句话核心摘要"
}

## Context
以下是用户现有的分类树：
${JSON.stringify(categoryTree)}

## Logic
- 标签应具体。
- 分类建议应保守：如果置信度低，建议返回 null。
- 始终使用中文回复。`;

  const parts: any[] = [];
  if (input.text) {
    parts.push({ text: `${systemInstruction}\n\n请分析以下输入：\n${input.text}` });
  } else {
    parts.push({ text: `${systemInstruction}\n\n请分析附件中的文件内容。` });
  }

  if (input.file) {
    parts.push({
      inlineData: {
        mimeType: input.file.mimeType,
        data: input.file.data,
      }
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          suggested_tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3-5 个具体的标签。",
          },
          suggested_category_id: {
            type: Type.STRING,
            description: "最匹配的分类 ID，置信度低则为 null。",
            nullable: true,
          },
          confidence_score: {
            type: Type.NUMBER,
            description: "分类预测的置信度 (0-1)。",
          },
          summary: {
            type: Type.STRING,
            description: "一句话核心摘要。",
          },
        },
        required: ["suggested_tags", "suggested_category_id", "confidence_score", "summary"],
      },
    },
  });

  const jsonStr = response.text?.trim() || "{}";
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse AI metadata response:", e);
    return null;
  }
}

export async function processInput(input: { text?: string; file?: { mimeType: string; data: string } }) {
  const parts: any[] = [];
  
  const systemInstruction = `你是一个极其严谨的“知识代谢分析师”。你的任务是将用户输入的任何碎片化信息（URL 抓取内容、PDF 文本、个人笔记）转化为一个结构化的“原子知识种子 (Seed Node)”。

## Constraints
- 拒绝废话：摘要必须是“干货”，直接告诉用户“是什么”和“怎么做”。
- 语义分类：如果内容关于“深蹲技巧”，分类应建议为“健身/力量训练”。
- 语言：始终使用中文回复。`;

  if (input.text) {
    parts.push({ text: `${systemInstruction}\n\n请分析以下输入：\n${input.text}` });
  } else {
    parts.push({ text: `${systemInstruction}\n\n请分析附件中的文件内容。` });
  }

  if (input.file) {
    parts.push({
      inlineData: {
        mimeType: input.file.mimeType,
        data: input.file.data,
      }
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { 
            type: Type.STRING, 
            description: "重新拟定一个简洁、具体的标题（去除小红书/网页的标题党水分）。" 
          },
          ai_summary: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "一个包含 3-5 个核心要点的数组，每条不超过 30 字，强调“行动建议”或“底层逻辑”。",
          },
          category_suggestion: {
            type: Type.OBJECT,
            properties: {
              path: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "建议的分类路径（如 ['设计', '交互设计']）。" 
              },
              confidence: { type: Type.NUMBER, description: "分类预测的置信度 (0-1)。" },
            },
            required: ["path", "confidence"],
          },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3-5 个具体的标签，如“交互设计”优于“设计”。",
          },
          content_type: { 
            type: Type.STRING, 
            enum: ["article", "tutorial", "recipe", "news", "thought"],
            description: "识别输入类型 (article | tutorial | recipe | news | thought)。" 
          },
          connection_logic: {
            type: Type.STRING,
            description: "解释为什么这个知识重要，以及它可能与哪些通用领域相关。",
          },
        },
        required: ["title", "ai_summary", "category_suggestion", "tags", "content_type", "connection_logic"],
      },
    },
  });

  const jsonStr = response.text?.trim() || "{}";
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse AI response:", e);
    return null;
  }
}

export async function generateFocusQuestion(content: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Based on the following knowledge snippet, generate a thought-provoking question to help the user reflect and apply this knowledge. Keep it short (1 sentence).
    
    Knowledge:
    ${content}
    `,
  });
  return response.text?.trim() || "How can you apply this today?";
}

export async function findLogicalConnections(currentSeed: { title: string; tags: string[] }, libraryIndex: { id: string; title: string }[]) {
  if (libraryIndex.length === 0) return [];

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `你是一个知识图谱专家。给定一个“当前知识点”和一组“已有知识库”的标题列表，找出最具有逻辑关联的 3-5 个节点。

## Logic
关联不仅限于相同标签，还包括：
1. 因果关系 (A 是 B 的原因)
2. 补充关系 (B 提供了 A 的细节)
3. 冲突关系 (A 与 B 的观点相反)
4. 进阶关系 (B 是 A 的深度延伸)

## Input
- Current_Seed: ${JSON.stringify(currentSeed)}
- Library_Index: ${JSON.stringify(libraryIndex)}

## Output (JSON Only)
始终返回一个 JSON 数组，格式如下：
[
  { "target_id": "string", "relation_type": "补充 | 冲突 | 进阶 | 因果", "reason": "一句话解释关联原因" }
]`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            target_id: { type: Type.STRING },
            relation_type: { type: Type.STRING },
            reason: { type: Type.STRING },
          },
          required: ["target_id", "relation_type", "reason"],
        },
      },
    },
  });

  const jsonStr = response.text?.trim() || "[]";
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse connections response:", e);
    return [];
  }
}
