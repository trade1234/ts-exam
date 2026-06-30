import { z } from "zod";
import { Application } from "../models/Application.js";

const applicationSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  grandfatherName: z.string().trim().min(1, "Grandfather name is required"),
  gender: z.enum(["Male", "Female"]),
  age: z.coerce.number().int().min(15).max(100),
  nationality: z.string().trim().min(1, "Nationality is required"),
  subCity: z.string().trim().min(1, "Sub city is required"),
  woreda: z.string().trim().min(1, "Woreda is required"),
  address: z.string().trim().min(1, "Address is required"),
  phoneNumber: z.string().trim().min(7, "Phone number is required"),
  email: z.string().trim().email("Email is invalid").optional().or(z.literal("")),
  maritalStatus: z.enum(["Single", "Married"]),
  physicalDisability: z.enum(["Yes", "No"]),
  disabilityDescription: z.string().trim().optional(),
  occupation: z.string().trim().min(1, "Occupation is required"),
  assessmentLevel: z.string().trim().min(1, "Assessment level is required"),
  collegeInstituteName: z.string().trim().min(1, "College or institute name is required"),
  institutionType: z.enum(["Government", "Private", "Other"]),
  trainingStartYear: z.coerce.number().int().min(1950).max(2100),
  trainingEndYear: z.coerce.number().int().min(1950).max(2100),
  trainingMode: z.enum(["Regular", "Extension", "Distance", "Other"]),
  trainingType: z.enum(["Formal", "Non-formal"]),
  cooperativeTraining: z.enum(["Large scale enterprise", "Medium scale enterprise", "Small scale enterprise", "None"]),
  employmentStatus: z.enum(["Self employed", "Government employed", "Private employed", "Unemployed"]),
  companyName: z.string().trim().optional(),
  companyCategory: z.enum(["Micro and small scale enterprise", "Medium and large enterprise", "Not applicable"]),
  registerFor: z.enum(["Theory", "Practical", "Both"]),
  assessmentType: z.enum(["New Assessment", "Reassessment"]),
  agreementAccepted: z.coerce.boolean().refine((value) => value === true, "Confirmation is required")
}).superRefine((data, ctx) => {
  if (data.physicalDisability === "Yes" && !data.disabilityDescription?.trim()) {
    ctx.addIssue({ code: "custom", path: ["disabilityDescription"], message: "Please describe the disability" });
  }
  if (data.trainingEndYear < data.trainingStartYear) {
    ctx.addIssue({ code: "custom", path: ["trainingEndYear"], message: "End year cannot be before start year" });
  }
});

async function generateApplicationNumber() {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const random = Math.floor(100000 + Math.random() * 900000);
    const applicationNumber = `COC-${year}-${random}`;
    const exists = await Application.exists({ applicationNumber });
    if (!exists) return applicationNumber;
  }
  return `COC-${year}-${Date.now()}`;
}

export async function createApplication(req, res, next) {
  try {
    const passportPhoto = req.files?.passportPhoto?.[0];
    const fayadaDigitalId = req.files?.fayadaDigitalId?.[0];

    if (!passportPhoto) {
      const error = new Error("Passport photo is required");
      error.statusCode = 400;
      throw error;
    }

    if (!fayadaDigitalId) {
      const error = new Error("FAYADA DIGITAL ID image is required");
      error.statusCode = 400;
      throw error;
    }

    const parsed = applicationSchema.parse(req.body);
    const applicationNumber = await generateApplicationNumber();

    const application = await Application.create({
      applicationNumber,
      personalInformation: {
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        grandfatherName: parsed.grandfatherName,
        gender: parsed.gender,
        age: parsed.age,
        nationality: parsed.nationality,
        subCity: parsed.subCity,
        woreda: parsed.woreda,
        address: parsed.address,
        phoneNumber: parsed.phoneNumber,
        email: parsed.email || "",
        maritalStatus: parsed.maritalStatus,
        physicalDisability: parsed.physicalDisability,
        disabilityDescription: parsed.disabilityDescription || ""
      },
      trainingInformation: {
        occupation: parsed.occupation,
        assessmentLevel: parsed.assessmentLevel,
        collegeInstituteName: parsed.collegeInstituteName,
        institutionType: parsed.institutionType,
        trainingStartYear: parsed.trainingStartYear,
        trainingEndYear: parsed.trainingEndYear,
        trainingMode: parsed.trainingMode,
        trainingType: parsed.trainingType,
        cooperativeTraining: parsed.cooperativeTraining
      },
      employmentInformation: {
        employmentStatus: parsed.employmentStatus,
        companyName: parsed.companyName || "",
        companyCategory: parsed.companyCategory
      },
      assessmentInformation: {
        registerFor: parsed.registerFor,
        assessmentType: parsed.assessmentType
      },
      passportPhoto: {
        filename: passportPhoto.filename,
        originalName: passportPhoto.originalname,
        path: `/uploads/applications/${passportPhoto.filename}`,
        mimetype: passportPhoto.mimetype,
        size: passportPhoto.size
      },
      fayadaDigitalId: {
        filename: fayadaDigitalId.filename,
        originalName: fayadaDigitalId.originalname,
        path: `/uploads/applications/${fayadaDigitalId.filename}`,
        mimetype: fayadaDigitalId.mimetype,
        size: fayadaDigitalId.size
      },
      agreementAccepted: parsed.agreementAccepted
    });

    res.status(201).json({
      message: "Application submitted successfully",
      applicationNumber: application.applicationNumber,
      submittedAt: application.submittedAt
    });
  } catch (error) {
    if (error.name === "ZodError") {
      error.statusCode = 400;
      error.message = "Application validation failed";
      error.details = error.errors;
    }
    next(error);
  }
}

export async function listApplications(req, res, next) {
  try {
    const search = req.query.search?.trim();
    const query = {};
    if (search) {
      const pattern = new RegExp(search, "i");
      query.$or = [
        { applicationNumber: pattern },
        { "personalInformation.firstName": pattern },
        { "personalInformation.lastName": pattern },
        { "personalInformation.grandfatherName": pattern },
        { "personalInformation.phoneNumber": pattern },
        { "personalInformation.email": pattern },
        { "trainingInformation.occupation": pattern },
        { "trainingInformation.collegeInstituteName": pattern }
      ];
    }

    const applications = await Application.find(query).sort({ submittedAt: -1, createdAt: -1 }).lean();
    res.json(applications);
  } catch (error) {
    next(error);
  }
}
export async function getApplicationByNumber(req, res, next) {
  try {
    const application = await Application.findOne({ applicationNumber: req.params.applicationNumber }).lean();
    if (!application) {
      const error = new Error("Application not found");
      error.statusCode = 404;
      throw error;
    }
    res.json({ application });
  } catch (error) {
    next(error);
  }
}


