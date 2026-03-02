import { Router } from "express";
import * as controller from "./familyMembers.controller";
import { authenticate, requireAdmin } from "../../middleware/auth.middleware";

const router = Router();

// Advanced search endpoints (admin only)
router.get("/search/by-fname", authenticate, requireAdmin, controller.getFamilyMembersByFName);
router.get("/search/by-lname", authenticate, requireAdmin, controller.getFamilyMembersByLName);

// POST /api/family-members — create a family member
router.post("/", authenticate,controller.createFamilyMember);

// GET /api/family-members/owners — list all family members with relationship = 'owner'
router.get("/owners", authenticate, controller.getOwnerFamilyMembers);

// GET /api/family-members/:username — list family members for an account
router.get("/:username", authenticate,controller.getFamilyMembers);

// PUT /api/family-members/:username/:f_name — update a family member
router.put("/:username/:f_name", authenticate,controller.updateFamilyMember);

// DELETE /api/family-members/:username/:f_name — delete a family member
router.delete("/:username/:f_name", authenticate, controller.deleteFamilyMember);

export default router;
