import { storage } from "../server/storage";
import { CaseType, CaseStatus, DocumentType } from "../shared/schema";

async function seed() {
    console.log("🌱 Seeding demo data...");

    // 1. Create Demo User
    const demoEmail = "demo@lawhelper.com";
    let user = await storage.getUserByEmail(demoEmail);

    if (!user) {
        user = await storage.createUser({
            name: "Alex Sterling",
            email: demoEmail,
            password: "demo-password-123",
        });
        console.log(`✅ Created demo user: ${user.name}`);
    } else {
        console.log(`ℹ️ Demo user already exists: ${user.name}`);
    }

    // 2. Create Demo Cases
    const demoCases = [
        {
            caseName: "Sterling v. Global Corp",
            caseNumber: "2024-CV-12345",
            clientName: "John Sterling",
            caseType: "personal-injury" as CaseType,
            status: "active" as CaseStatus,
            description: "High-stakes personal injury case involving a multi-vehicle accident with the defendant's commercial truck.",
            jurisdiction: "California Superior Court, Los Angeles",
            practiceArea: "Torts",
            leadAttorney: "Alex Sterling",
            opposingParty: "Global Corp Logistics",
            opposingCounsel: "Sarah Miller (Dewey & Howe)",
            valueLow: "250000.00",
            valueHigh: "750000.00",
            dateOpened: new Date("2024-01-15"),
        },
        {
            caseName: "TechEdge IP Dispute",
            caseNumber: "IP-2023-9988",
            clientName: "TechEdge Systems LLC",
            caseType: "intellectual-property" as CaseType,
            status: "active" as CaseStatus,
            description: "Patent infringement claim regarding proprietary cloud computing architectures.",
            jurisdiction: "Federal District Court, Northern District of California",
            practiceArea: "IP Litigation",
            leadAttorney: "Alex Sterling",
            opposingParty: "CloudMax Solutions",
            opposingCounsel: "Marcus Vane (Vane & Associates)",
            valueLow: "1200000.00",
            valueHigh: "3500000.00",
            dateOpened: new Date("2023-11-20"),
        },
        {
            caseName: "Rivera Employment Claim",
            caseNumber: "EMP-2024-0042",
            clientName: "Elena Rivera",
            caseType: "employment" as CaseType,
            status: "pending" as CaseStatus,
            description: "Wrongful termination and workplace discrimination based on age and gender.",
            jurisdiction: "EEOC / California Labor Commission",
            practiceArea: "Labor Law",
            leadAttorney: "Alex Sterling",
            opposingParty: "Retail Giants Inc.",
            opposingCounsel: "HR Legal Team",
            valueLow: "75000.00",
            valueHigh: "150000.00",
            dateOpened: new Date("2024-02-05"),
        }
    ];

    const createdCases = [];
    for (const c of demoCases) {
        const existingCases = await storage.getCasesByUser(user.id);
        const exists = existingCases.find(ec => ec.caseName === c.caseName);

        if (!exists) {
            const newCase = await storage.createCase({ ...c, userId: user.id });
            createdCases.push(newCase);
            console.log(`✅ Created case: ${newCase.caseName}`);
        } else {
            createdCases.push(exists);
            console.log(`ℹ️ Case already exists: ${exists.caseName}`);
        }
    }

    // 3. Create Demo Medical Records (for the Personal Injury case)
    const piCase = createdCases.find(c => c.caseType === "personal-injury");
    if (piCase) {
        const demoRecords = [
            {
                userId: user.id,
                caseId: piCase.id,
                recordType: "treatment",
                providerName: "St. Jude Medical Center",
                serviceDate: new Date("2024-01-20"),
                diagnosisCodes: ["S82.101A", "M54.5"],
                procedureCodes: ["72141", "99285"],
                treatment: "Emergency Room Visit, MRI of Lumbar Spine, Physical Therapy Referral",
                medications: ["Naproxen 500mg", "Cyclobenzaprine 10mg"],
                chargeAmount: "12500.00",
                paidAmount: "8500.00",
                notes: "Patient complained of severe lower back pain and left leg numbness following accident.",
            },
            {
                userId: user.id,
                caseId: piCase.id,
                recordType: "bill",
                providerName: "Pacific Radiology Group",
                serviceDate: new Date("2024-01-22"),
                diagnosisCodes: ["M54.16"],
                procedureCodes: ["72148"],
                treatment: "MRI Lumbar Spine without contrast",
                chargeAmount: "3200.00",
                paidAmount: "0.00",
                notes: "Outstanding balance. Sent to collections warning.",
            }
        ];

        for (const r of demoRecords) {
            const existingRecords = await storage.getMedicalRecordsByCase(piCase.id);
            const exists = existingRecords.find(er => er.providerName === r.providerName && er.serviceDate?.getTime() === r.serviceDate.getTime());

            if (!exists) {
                await storage.createMedicalRecord(r);
                console.log(`✅ Created medical record for: ${r.providerName}`);
            }
        }
    }

    // 4. Create Demo Documents
    const demoDocs = [
        {
            userId: user.id,
            caseId: piCase?.id,
            title: "Initial Case Strategy - Sterling v. Global",
            documentType: "legal-brief" as DocumentType,
            content: "## Case Strategy\n\n1. **Liability**: Focus on commercial driver's log violations.\n2. **Damages**: Emphasize permanent nature of L4-L5 disc protrusion.\n3. **Witnesses**: Retain accident reconstruction expert.",
            generatorTool: "AI Legal Search",
            aiModel: "gpt-4o",
        },
        {
            userId: user.id,
            caseId: createdCases[1].id,
            title: "TechEdge Patent Analysis Summary",
            documentType: "legal-brief" as DocumentType,
            content: "The defendant's 'CloudBurst' architecture likely infringes on Claim 7 and 12 of the '842 Patent. Analysis shows direct mapping of the load balancing logic to the proprietary algorithms developed by TechEdge in 2019.",
            generatorTool: "Brief Summarizer",
            aiModel: "gpt-4o-mini",
        }
    ];

    for (const d of demoDocs) {
        const existingDocs = await storage.getDocumentsByUser(user.id);
        const exists = existingDocs.find(ed => ed.title === d.title);

        if (!exists) {
            await storage.createDocument({ ...d, userId: user.id });
            console.log(`✅ Created document: ${d.title}`);
        }
    }

    console.log("✨ Seeding complete!");
    process.exit(0);
}

seed().catch(err => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
});
