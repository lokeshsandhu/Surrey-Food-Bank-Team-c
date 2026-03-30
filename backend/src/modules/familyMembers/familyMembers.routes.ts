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

// PUT /api/family-members/:username/:memberRef — update a family member by id or first name
router.put("/:username/:memberRef", authenticate,controller.updateFamilyMember);

// DELETE /api/family-members/:username/:memberRef — delete a family member by id or first name
router.delete("/:username/:memberRef", authenticate, controller.deleteFamilyMember);

// NOTUSED
// GET /api/family-members/exists/:username/:memberRef — check if family member exists by id or first name
// router.get("/exists/:username/:memberRef", controller.checkUsernameFamilyMemberExists);

export default router;
