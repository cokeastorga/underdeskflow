import { describe, it, expect } from "vitest";
import { calculateEffectivePrice } from "./engine";
import { PriceRule } from "./types";

describe("Pricing Engine", () => {
    
  it("returns base price when no rules exist", () => {
    const price = calculateEffectivePrice(1000, []);
    expect(price).toBe(1000);
  });

  it("applies a GLOBAL percentage discount correctly", () => {
    const rule: PriceRule = {
        id: "pr_1", storeId: "s1", variantId: "v1",
        scope: "GLOBAL", type: "PERCENTAGE_DISCOUNT", value: 15,
        isActive: true, createdAt: 0, updatedAt: 0
    };
    const price = calculateEffectivePrice(1000, [rule]);
    expect(price).toBe(850);
  });

  it("prioritizes CHANNEL rules over BRANCH rules", () => {
    const basePrice = 1000;
    const branchRule: PriceRule = {
        id: "pr_1", storeId: "s1", variantId: "v1",
        scope: "BRANCH", scopeId: "branch_centro", type: "FIXED", value: 1200,
        isActive: true, createdAt: 0, updatedAt: 0
    };
    
    const channelRule: PriceRule = {
        id: "pr_2", storeId: "s1", variantId: "v1",
        scope: "CHANNEL", scopeId: "EXTERNAL_WEB", type: "FIXED", value: 1500,
        isActive: true, createdAt: 0, updatedAt: 0
    };

    const price = calculateEffectivePrice(basePrice, [branchRule, channelRule], "EXTERNAL_WEB", "branch_centro");
    
    // The Channel rule should win
    expect(price).toBe(1500);
  });
  
  it("prioritizes BRANCH rules over GLOBAL rules", () => {
    const basePrice = 1000;
    const globalRule: PriceRule = {
        id: "pr_1", storeId: "s1", variantId: "v1",
        scope: "GLOBAL", type: "PERCENTAGE_MARKUP", value: 10, // 1100
        isActive: true, createdAt: 0, updatedAt: 0
    };
    
    const branchRule: PriceRule = {
        id: "pr_2", storeId: "s1", variantId: "v1",
        scope: "BRANCH", scopeId: "branch_sur", type: "FIXED", value: 900,
        isActive: true, createdAt: 0, updatedAt: 0
    };

    const price = calculateEffectivePrice(basePrice, [globalRule, branchRule], undefined, "branch_sur");
    
    // The Branch rule should win over Global Markup
    expect(price).toBe(900);
  });
});
