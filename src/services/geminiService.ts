import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export const extractionSchema = {
  type: Type.OBJECT,
  properties: {
    identity: {
      type: Type.OBJECT,
      properties: {
        fullName: { type: Type.STRING, description: "Full legal name. Mandatory." },
        fatherHusbandName: { type: Type.STRING },
        cnicNumber: { type: Type.STRING, description: "CNIC XXXXX-XXXXXXX-X format. Mandatory." },
        dateOfBirth: { type: Type.STRING, description: "YYYY-MM-DD" },
        gender: { type: Type.STRING, enum: ["Male", "Female", "Other"] },
        maritalStatus: { type: Type.STRING, enum: ["Single", "Married", "Divorced"] },
        mobileNumber: { type: Type.STRING, description: "+92 XXX XXXXXXX. Mandatory." },
        whatsappNumber: { type: Type.STRING, description: "+92 XXX XXXXXXX" },
        religion: { type: Type.STRING, description: "Extract Muslim/Christian/Other from Form 49 checkboxes" },
        emergencyContact: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            relationship: { type: Type.STRING },
            phone: { type: Type.STRING }
          }
        }
      }
    },
    professional_profile: {
      type: Type.OBJECT,
      properties: {
        positionApplied: { type: Type.STRING, enum: ["R/N", "BSN", "Aid Nurse", "Midwife", "DPT", "ICU/Anes", "Doctor", "Attendant", "Babysitter"] },
        experienceYears: { type: Type.NUMBER },
        shiftPreference: { type: Type.STRING, enum: ["Day", "Night", "24 hrs"] },
        topSkills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Top 3 clinical skills from CV" }
      }
    },
    geographic_data: {
      type: Type.OBJECT,
      properties: {
        areaTown: { type: Type.STRING },
        district: { type: Type.STRING, enum: ["Nazimabad (Central)", "Gulshan (East)", "Karachi South", "Orangi (West)", "Keamari", "Korangi", "Malir"] },
        completeAddress: { type: Type.STRING },
        addressFromBill: { type: Type.STRING, description: "Address extracted from Electricity Bill" },
        reconciliationAlert: { type: Type.BOOLEAN, description: "True if document addresses or names mismatch" }
      }
    },
    financial_reference: {
      type: Type.OBJECT,
      properties: {
        expectedSalaryPKR: { type: Type.NUMBER },
        preferredPayment: { type: Type.STRING, enum: ["Cash", "JazzCash", "EasyPesa", "Bank"] },
        bankDetails: {
          type: Type.OBJECT,
          properties: {
            bankName: { type: Type.STRING },
            accountNo: { type: Type.STRING },
            accountTitle: { type: Type.STRING },
            iban: { type: Type.STRING }
          }
        }
      }
    },
    audit_metadata: {
      type: Type.OBJECT,
      properties: {
        acknowledgmentSigned: { type: Type.BOOLEAN, description: "Signed 'Employee Acknowledgment' regarding duty abandonment" },
        policyCheck: { type: Type.STRING, enum: ["Pass", "Fail"], description: "Overall policy compliance status" },
        criticalMissingInfo: { type: Type.BOOLEAN, description: "True if Full Name, CNIC, or Mobile is missing/illegible" },
        missingFieldsList: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of missing mandatory fields (e.g., ['fullName', 'cnicNumber', 'mobileNumber'])" },
        reconciliationDetails: { type: Type.STRING, description: "Brief explanation of any name/address mismatches found across the 4 documents" },
        dataConfidence: { type: Type.STRING, enum: ["High", "Low"] }
      }
    }
  },
  required: ["identity", "professional_profile", "geographic_data", "financial_reference", "audit_metadata"]
};

export async function extractStaffData(imageBase64s: string[]) {
  const model = "gemini-flash-latest"; 
  
  const prompt = `
    Role: High-Precision Registrar for HMSP Dashboard Karachi (Home Medical Services Provider).
    Task: Analyze the provided images (Employee Form, CNIC, CV, and/or Electricity Bill) for a medical staffing ledger.
    Extract as much information as possible even if only one document (like a CV) is provided.
    
    The "Big Three" Mandatory Fields:
    1. fullName
    2. cnicNumber (format: XXXXX-XXXXXXX-X)
    3. mobileNumber (format: +92 XXX XXXXXXX)
    
    Processing Guidelines:
    1. Document Availability:
       - You may receive 1 to 4 images.
       - Extract data from whatever is available.
       - If a document type is missing, do not complain in reconciliationDetails unless there is a conflict.
    
    2. Mandatory Field Gatekeeper:
       - Prioritize extracting the "Big Three".
       - If any of the Big Three are missing or unreadable, return null for that field.
       - Set audit_metadata.criticalMissingInfo to true only if one of the "Big Three" is missing.
       - Populate audit_metadata.missingFieldsList with the names of the missing Big Three fields.
    
    3. Cross-Verification:
       - Identity Sync: Use available documents (CNIC/CV/Form) to verify details.
       - Address Anchor: Extract address from Bill if present, or CV/Form.
    
    4. Compliance:
       - acknowledgmentSigned: Check if any form or CV mentions acceptance of terms or has a signature.
       - policyCheck: Pass if Big Three are found.
    
    5. Reconciliation Details:
       - Use this field to note WHICH documents were found and if any data conflicts (e.g., "Name on CNIC vs CV").
       - Example: "CV provided. CNIC and Bill missing. Extracted basic profile."
    
    Return the data as valid JSON matching the responseSchema. No preamble.
  `;

  try {
    const inlineData = imageBase64s.map(base64 => ({
      inlineData: { data: base64, mimeType: "image/jpeg" }
    }));

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            { text: prompt },
            ...inlineData
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: extractionSchema
      }
    });
    
    if (!response.text) {
      throw new Error("No response text received from AI");
    }

    let cleanedText = response.text.trim();
    // Remove potential markdown blocks
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```json\s*/, "").replace(/```$/, "").trim();
    }

    try {
      return JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON Parse Error. Cleaned text:", cleanedText);
      throw new Error("AI returned invalid JSON format. Please try again.");
    }
  } catch (error) {
    console.error("Extraction error:", error);
    throw error;
  }
}
