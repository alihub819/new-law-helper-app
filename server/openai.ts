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

export async function answerLegalQuestion(question: string): Promise<any> {
  try {
    const prompt = `You are an expert legal advisor. Answer this legal question comprehensively with accurate references and citations.

Question: ${question}

Provide a detailed response in JSON format:
{
  "answer": "Comprehensive answer to the legal question",
  "references": [
    {
      "title": "Legal source title",
      "citation": "Proper legal citation",
      "summary": "Brief summary of relevance"
    }
  ],
  "keyPoints": [
    "Important legal point 1",
    "Important legal point 2"
  ],
  "jurisdiction": "Applicable jurisdiction if relevant",
  "disclaimer": "This is legal information, not legal advice. Consult with a qualified attorney for specific legal matters.",
  "relatedConcepts": ["concept 1", "concept 2"],
  "practicalAdvice": [
    "Practical step 1",
    "Practical step 2"
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert legal advisor with comprehensive knowledge of law across multiple jurisdictions. Provide accurate, well-cited legal information with proper references."
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
    console.error("OpenAI law agent error:", error);
    throw new Error("Failed to answer legal question");
  }
}

export async function performWebSearch(query: string): Promise<any> {
  try {
    const prompt = `You are a legal web search specialist. Based on this search query: "${query}", provide realistic web search results that would typically be found when searching for legal information online.

Simulate web search results with current, relevant legal information and provide an AI-generated summary.

Provide results in JSON format:
{
  "results": [
    {
      "title": "Search result title",
      "url": "https://example-legal-site.com/article",
      "domain": "legal-site.com",
      "snippet": "Brief excerpt from the page describing the legal information",
      "date": "2024-12-15"
    }
  ],
  "totalResults": 8,
  "summary": "AI-generated summary of the key findings from the search results, highlighting the most important legal information and trends.",
  "relatedQueries": ["related query 1", "related query 2"],
  "legalUpdates": "Any recent legal developments or changes related to the search topic"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a legal information researcher specializing in finding and summarizing current legal information from web sources. Provide realistic, current legal search results."
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
    console.error("OpenAI web search error:", error);
    throw new Error("Failed to perform web search");
  }
}

export async function generateDocument(documentType: string, inputMethod: 'voice' | 'paste' | 'manual', textContent?: string, formData?: Record<string, string>): Promise<any> {
  try {
    let contentDescription = '';
    let documentSpecificInstructions = '';
    
    // Build content description based on input method
    if (inputMethod === 'voice' || inputMethod === 'paste') {
      contentDescription = textContent || '';
    } else if (inputMethod === 'manual' && formData) {
      contentDescription = Object.entries(formData)
        .filter(([_, value]) => value && value.trim() !== '')
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
    }

    // Document-specific formatting instructions
    switch (documentType) {
      case 'business-letter':
        documentSpecificInstructions = `
BUSINESS LETTER SPECIFIC REQUIREMENTS:
- Use full block format (all text aligned left)
- Include sender's letterhead information at top
- Date should be 2-3 lines below sender info
- Recipient's address 2 lines below date
- Subject line format: "Re: [Subject]"
- Professional salutation: "Dear Mr./Ms. [Last Name]:" or "Dear [Title] [Last Name]:"
- Body paragraphs with single spacing within, double spacing between
- Professional closing: "Sincerely," "Best regards," or "Respectfully,"
- 4 line spaces for signature, then typed name and title`;
        break;
      
      case 'cover-letter':
        documentSpecificInstructions = `
COVER LETTER SPECIFIC REQUIREMENTS:
- Modern cover letter format with applicant info at top
- Addressed to specific hiring manager if known, otherwise "Dear Hiring Manager:"
- Opening paragraph: State position and how you learned about it
- Body paragraph 1: Relevant experience and achievements with specific examples
- Body paragraph 2: Skills and qualifications that match job requirements  
- Body paragraph 3: Why you want to work for this specific company
- Closing paragraph: Call to action and availability for interview
- Professional closing with "Sincerely," and full name
- Keep to one page maximum`;
        break;

      case 'recommendation-letter':
        documentSpecificInstructions = `
RECOMMENDATION LETTER SPECIFIC REQUIREMENTS:
- Academic/Professional letterhead format
- Date and recipient information (if known)
- Subject line: "Letter of Recommendation for [Name]"
- Opening: State relationship to candidate and duration
- Body paragraph 1: Candidate's strengths and key qualifications
- Body paragraph 2: Specific examples of achievements and performance
- Body paragraph 3: Comparison to peers and overall assessment
- Closing: Clear recommendation level and contact information for follow-up
- Professional signature with credentials and title`;
        break;

      case 'service-agreement':
        documentSpecificInstructions = `
SERVICE AGREEMENT SPECIFIC REQUIREMENTS:
- Contract title: "SERVICE AGREEMENT" centered at top
- Parties section identifying Provider and Client with full legal names
- Recitals section stating the purpose and background
- Scope of Services section with detailed service descriptions
- Term and Termination section with start/end dates
- Compensation and Payment Terms section
- Intellectual Property and Confidentiality clauses
- Governing Law clause specifying state jurisdiction
- Signature blocks with dates for both parties
- Include standard contract disclaimers and notices`;
        break;

      case 'employment-contract':
        documentSpecificInstructions = `
EMPLOYMENT CONTRACT SPECIFIC REQUIREMENTS:
- Contract title: "EMPLOYMENT AGREEMENT" centered at top
- Parties section: Employer (Company) and Employee with addresses
- Position and Duties section with job title and responsibilities
- Compensation section: salary, benefits, payment schedule
- Term of Employment section with start date and at-will status
- Confidentiality and Non-Disclosure provisions
- Intellectual Property assignment clauses
- Termination and Severance provisions
- Governing law and dispute resolution clauses
- Signature blocks with dates for both parties`;
        break;

      case 'job-application':
        documentSpecificInstructions = `
JOB APPLICATION SPECIFIC REQUIREMENTS:
- Application header: "EMPLOYMENT APPLICATION"
- Personal Information section with all contact details
- Position Information: job title, salary expectations, availability
- Employment History: chronological listing with dates, companies, positions
- Education section: degrees, institutions, graduation dates
- Skills and Qualifications relevant to position
- References section with complete contact information
- Certification statements and applicant signature with date
- Equal Opportunity/Non-Discrimination statements
- Format as official application form with clear sections`;
        break;

      case 'visa-application':
        documentSpecificInstructions = `
VISA APPLICATION SPECIFIC REQUIREMENTS:
- Official application header with visa type
- Personal Details section: full legal name, date/place of birth, nationality
- Passport Information: number, issue/expiry dates, issuing country
- Travel Information: purpose, duration, planned dates, accommodation
- Financial Information: funding source, bank statements reference
- Supporting Documents checklist
- Declaration and signature section with date
- Official government application format style
- Include all required legal disclaimers and warnings
- Clear section divisions with numbered items where appropriate`;
        break;

      default:
        documentSpecificInstructions = `
GENERAL DOCUMENT REQUIREMENTS:
- Professional USA business document format
- Appropriate headers and contact information
- Clear structure with logical sections
- Professional tone and language throughout
- Proper closing and signature sections`;
    }

    const prompt = `You are a professional document generation specialist with expertise in USA business and legal document standards. Generate a ${documentType} document following strict USA professional formatting and content standards.

Document Type: ${documentType}
Input Method: ${inputMethod}
Content/Requirements:
${contentDescription}

${documentSpecificInstructions}

GENERAL USA FORMATTING STANDARDS:
- Date format: Month DD, YYYY (e.g., January 15, 2024)
- Address format: Street Address, Suite/Unit, City, State ZIP
- Phone format: (XXX) XXX-XXXX
- Professional language and tone throughout
- Proper spacing and margins
- Clear section divisions
- Consistent formatting

Return the response in JSON format:
{
  "id": "unique-document-id",
  "type": "${documentType}",
  "title": "Document Title",
  "content": "Raw document content",
  "formattedContent": "Formatted document content with proper spacing and structure",
  "metadata": {
    "wordCount": 0,
    "estimatedPages": 1,
    "documentStandard": "USA International",
    "generatedAt": "current-date",
    "inputMethod": "${inputMethod}"
  },
  "sections": [
    {
      "name": "Header",
      "content": "Header content"
    },
    {
      "name": "Body",
      "content": "Main body content"
    },
    {
      "name": "Closing",
      "content": "Closing content"
    }
  ],
  "suggestions": [
    "Suggestion 1 for improvement",
    "Suggestion 2 for customization"
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert document generation specialist with extensive knowledge of USA business and legal document standards. Generate professional, properly formatted documents that comply with international USA standards for business correspondence, contracts, and applications."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Add current timestamp and ensure proper structure
    return {
      ...result,
      createdAt: new Date().toISOString(),
      id: result.id || `doc_${Date.now()}`,
      metadata: {
        ...result.metadata,
        generatedAt: new Date().toISOString(),
        inputMethod: inputMethod
      }
    };
  } catch (error) {
    console.error("OpenAI document generation error:", error);
    throw new Error("Failed to generate document");
  }
}
