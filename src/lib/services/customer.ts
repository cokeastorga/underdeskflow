import {
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    addDoc,
    serverTimestamp,
    increment
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Order, Customer } from "@/types";

/**
 * Syncs an order to a customer profile.
 * - Creates a new customer if email+storeId doesn't exist.
 * - Updates metrics if customer exists.
 * - Adds unique shipping addresses.
 */
export const syncOrderToCustomer = async (order: Order) => {
    try {
        if (!order.email || !order.storeId) return;

        const customersRef = collection(db, "customers");
        const q = query(
            customersRef,
            where("email", "==", order.email),
            where("storeId", "==", order.storeId)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Update existing customer
            const customerDoc = querySnapshot.docs[0];
            const customerData = customerDoc.data() as Customer;

            // Check if address exists
            const newAddress = {
                type: 'shipping' as const,
                address: order.shippingAddress.address,
                city: order.shippingAddress.city,
                zip: order.shippingAddress.zip,
                country: order.shippingAddress.country,
                phone: order.shippingAddress.phone
            };

            const addressExists = customerData.addresses?.some(
                a => a.address === newAddress.address && a.zip === newAddress.zip
            );

            const updates: any = {
                totalOrders: increment(1),
                totalSpent: increment(order.total),
                lastOrderDate: order.createdAt, // Assumes syncing latest order
                updatedAt: Date.now()
            };

            if (!addressExists) {
                updates.addresses = [...(customerData.addresses || []), newAddress];
            }

            // Update name/phone if missing? Maybe not, keep original registration?
            // Let's update phone if provided and currently empty
            if (!customerData.phone && order.shippingAddress.phone) {
                updates.phone = order.shippingAddress.phone;
            }

            await updateDoc(doc(db, "customers", customerDoc.id), updates);
            console.log(`Updated customer ${customerDoc.id}`);

        } else {
            // Create new customer
            const newCustomer: Omit<Customer, 'id'> = {
                storeId: order.storeId,
                firstName: order.shippingAddress.firstName || "Guest",
                lastName: order.shippingAddress.lastName || "User",
                email: order.email,
                phone: order.shippingAddress.phone,
                totalOrders: 1,
                totalSpent: order.total,
                lastOrderDate: order.createdAt,
                addresses: [{
                    type: 'shipping',
                    address: order.shippingAddress.address,
                    city: order.shippingAddress.city,
                    zip: order.shippingAddress.zip,
                    country: order.shippingAddress.country,
                    phone: order.shippingAddress.phone
                }],
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            await addDoc(customersRef, newCustomer);
            console.log(`Created new customer for ${order.email}`);
        }
    } catch (error) {
        console.error("Error syncing order to customer:", error);
    }
};
