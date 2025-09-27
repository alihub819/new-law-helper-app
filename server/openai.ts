import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key" 
});

export async function searchLegalDatabase(query: string, filters?: any): Promise<any> {
  try {
    const prompt = `You are a legal research assistant. Search for relevant legal information based on this query: "${query}".

Please provide a comprehensive response that includes:
1. Relevant case law with citations
2. Applicable statutes and regulations
3. Legal precedents
4. Relevance scores (0-100%)
5. Brief summaries of each result

Format the response as JSON with this structure:
{
  "results": [
    {
      "title": "Case or Statute Title",
      "type": "Case Law" | "Federal Statute" | "State Law" | "Regulation" | "Supreme Court",
      "citation": "Legal citation",
      "relevance": 95,
      "summary": "Brief summary of the legal document",
      "keyPoints": ["point 1", "point 2"],
      "url": "link to full document"
    }
  ],
  "totalResults": 5,
  "searchTime": "2.3 seconds"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert legal research assistant with access to comprehensive legal databases. Provide accurate, relevant legal information with proper citations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error("OpenAI legal search error:", error);
    throw new Error("Failed to perform legal search");
  }
}

export async function summarizeDocument(documentText: string, summaryType: string = 'quick'): Promise<any> {
  try {
    const prompt = `You are a legal document analysis expert. Analyze this legal document and provide a ${summaryType} summary.

Document text:
${documentText}

Please provide a comprehensive analysis in JSON format:
{
  "documentType": "Contract/Brief/Statute/etc",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "parties": ["party names if applicable"],
  "summary": "Detailed summary of the document",
  "legalImplications": [
    {
      "type": "warning" | "notice" | "recommendation",
      "message": "Important legal consideration",
      "severity": "high" | "medium" | "low"
    }
  ],
  "importantDates": ["date 1", "date 2"],
  "financialTerms": {
    "totalValue": "amount if applicable",
    "paymentSchedule": "schedule if applicable"
  },
  "risks": ["potential risk 1", "potential risk 2"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert legal document analyzer. Provide thorough, accurate analysis of legal documents with practical insights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error("OpenAI document summarization error:", error);
    throw new Error("Failed to summarize document");
  }
}

export async function analyzeRisk(caseData: {
  caseType: string;
  description: string;
  jurisdiction?: string;
  caseValue?: string;
}): Promise<any> {
  try {
    const prompt = `You are a legal risk assessment expert. Analyze this case and provide a comprehensive risk assessment.

Case Details:
- Type: ${caseData.caseType}
- Description: ${caseData.description}
- Jurisdiction: ${caseData.jurisdiction || 'Not specified'}
- Case Value: ${caseData.caseValue || 'Not specified'}

Provide a detailed risk analysis in JSON format:
{
  "successProbability": 75,
  "confidenceLevel": 85,
  "riskFactors": [
    {
      "factor": "Risk description",
      "severity": "high" | "medium" | "low",
      "impact": "Description of potential impact"
    }
  ],
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "recommendations": {
    "immediate": ["action 1", "action 2"],
    "longterm": ["strategy 1", "strategy 2"]
  },
  "precedentAnalysis": {
    "similarCases": 150,
    "successRate": 68,
    "averageSettlement": "$75,000"
  },
  "settlementRange": {
    "low": "$45,000",
    "high": "$95,000",
    "recommended": "$70,000"
  },
  "timeline": {
    "estimated": "12-18 months",
    "factors": ["factor 1", "factor 2"]
  }
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert legal risk analyst with extensive knowledge of case outcomes, precedents, and legal strategy. Provide data-driven risk assessments."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error("OpenAI risk analysis error:", error);
    throw new Error("Failed to analyze legal risk");
  }
}
