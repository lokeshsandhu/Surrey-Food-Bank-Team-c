import { Request, Response } from "express";
import * as service from "./familyMembers.service";

//Find all people with this first name
export async function getFamilyMembersByFName(req: Request, res: Response) {
    try {
        const { f_name } = req.query;
        if (!f_name) {
            res.status(400).json({ error: "f_name query param required" });
            return;
        }
        const results = await service.findFamilyMembersByFName(String(f_name));
        res.status(200).json(results);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

// Find all people with this last name
export async function getFamilyMembersByLName(req: Request, res: Response) {
    try {
        const { l_name } = req.query;
        if (!l_name) {
            res.status(400).json({ error: "l_name query param required" });
            return;
        }
        const results = await service.findFamilyMembersByLName(String(l_name));
        res.status(200).json(results);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

// Create a new family member
export async function createFamilyMember(req: Request, res: Response) {
    try {
        const member = await service.createFamilyMember(req.body);
        res.status(201).json(member);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

// Find all family members under given username
export async function getFamilyMembers(req: Request, res: Response) {
    try {
        const members = await service.getFamilyMembers(req.params.username);
        res.status(200).json(members);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

// Update family member's details
export async function updateFamilyMember(req: Request, res: Response) {
    try {
        const { username, memberRef } = req.params;
        const numericId = Number(memberRef);
        const identifier = Number.isNaN(numericId) ? memberRef : numericId;
        const updated = await service.updateFamilyMember(username, identifier, req.body);
        if (!updated) {
            res.status(404).json({ error: "Family member not found" });
            return;
        }
        res.status(200).json(updated);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

//delete this family member from an account
export async function deleteFamilyMember(req: Request, res: Response) {
    try {
        const { username, memberRef } = req.params;
        const numericId = Number(memberRef);
        const identifier = Number.isNaN(numericId) ? memberRef : numericId;
        const deleted = await service.deleteFamilyMember(username, identifier);
        if (!deleted) {
            res.status(404).json({ error: "Family member not found" });
            return;
        }
        res.status(200).json(deleted);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

// List all family members with relationship = 'owner'
export async function getOwnerFamilyMembers(req: Request, res: Response) {
    try {
        const members = await service.getOwnerFamilyMembers();
        res.status(200).json(members);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

// Check if family member with given username and identifier already exists
export async function checkUsernameFamilyMemberExists(req: Request, res: Response) {
    try {
        const { username, memberRef } = req.params;
        const numericId = Number(memberRef);
        const identifier = Number.isNaN(numericId) ? memberRef : numericId;
        const exists = await service.usernameFamilyMemberExists(username, identifier);
        res.status(200).json({ exists });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}
