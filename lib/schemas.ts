import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  project: z.string().min(1, "Project is required"),
  relatedFeature: z.string().min(1, "Feature is required"),
  category: z.string().min(1, "Category is required"),
  status: z.string().min(1, "Status is required"),
  priority: z.string().min(1, "Priority is required"),
  dueDate: z.string().optional().nullable(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  notes: z.string().optional(),
  evidence: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
});

export const bugSchema = z.object({
  project: z.string().min(1, "Project is required"),
  module: z.string().min(1, "Module is required"),
  bugType: z.string().min(1, "Bug type is required"),
  title: z.string().min(5, "Title must be at least 5 characters"),
  preconditions: z.string().min(1, "Preconditions are required"),
  stepsToReproduce: z.string().min(1, "Steps are required"),
  expectedResult: z.string().min(1, "Expected result is required"),
  actualResult: z.string().min(1, "Actual result is required"),
  severity: z.enum(["low", "medium", "high", "critical"]),
  priority: z.enum(["P0", "P1", "P2", "P3"]),
  status: z.string().min(1, "Status is required"),
  evidence: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
});

export const testCaseScenarioSchema = z.object({
  projectName: z.string().min(1, "Project name is required"),
  moduleName: z.string().min(1, "Module name is required"),
  referenceDocument: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  traceability: z.string().optional(),
  createdBy: z.string().min(1, "Creator name is required"),
});

export const meetingNoteSchema = z.object({
  date: z.string().min(1, "Date is required"),
  title: z.string().min(3, "Title is required"),
  project: z.string().min(1, "Project is required"),
  participants: z.string().min(1, "Participants are required"),
  summary: z.string().min(1, "Summary is required"),
  decisions: z.string().optional(),
  actionItems: z.string().optional(),
  notes: z.string().optional(),
  evidence: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
});

export const dailyLogSchema = z.object({
  date: z.string().min(1, "Date is required"),
  project: z.string().min(1, "Project is required"),
  whatTested: z.string().min(1, "Field is required"),
  issuesFound: z.string().optional(),
  progressSummary: z.string().min(1, "Summary is required"),
  blockers: z.string().optional(),
  nextPlan: z.string().min(1, "Next plan is required"),
  notes: z.string().optional(),
  evidence: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
});

export const schemas = {
  tasks: taskSchema,
  bugs: bugSchema,
  "test-cases": testCaseScenarioSchema,
  "meeting-notes": meetingNoteSchema,
  "daily-logs": dailyLogSchema,
};
