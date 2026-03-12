import { adminDb } from "@/lib/firebase/admin-config";
import { Branch, Register } from "./types";
import { FieldValue } from "firebase-admin/firestore";

const branchesCol = adminDb.collection("branches");
const registersCol = adminDb.collection("registers");

export async function createBranch(storeId: string, data: Partial<Branch>) {
    const docRef = branchesCol.doc();
    const now = Date.now();
    const branch: Branch = {
        id: docRef.id,
        storeId,
        name: data.name || "Main Branch",
        address: data.address || "",
        phoneNumber: data.phoneNumber || "",
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: now,
        updatedAt: now,
    };
    await docRef.set(branch);
    return branch;
}

export async function getBranches(storeId: string) {
    const snap = await branchesCol.where("storeId", "==", storeId).get();
    return snap.docs.map(doc => doc.data() as Branch);
}

export async function createRegister(storeId: string, branchId: string, data: Partial<Register>) {
    const docRef = registersCol.doc();
    const now = Date.now();
    const register: Register = {
        id: docRef.id,
        storeId,
        branchId,
        name: data.name || "Register 1",
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: now,
        updatedAt: now,
    };
    await docRef.set(register);
    return register;
}

export async function getRegisters(storeId: string, branchId?: string) {
    let query: FirebaseFirestore.Query = registersCol.where("storeId", "==", storeId);
    if (branchId) {
        query = query.where("branchId", "==", branchId);
    }
    const snap = await query.get();
    return snap.docs.map(doc => doc.data() as Register);
}
