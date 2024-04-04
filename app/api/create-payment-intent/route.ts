import Stripe from "stripe";
import prisma from "@/libs/prismadb";
import { NextResponse } from "next/server";
import { CartProductType } from "@/app/product/[productId]/ProductDetails";
import { getCurrentUser } from "@/actions/getCurrentUser";
import { products } from "@/utils/products";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

// Do it again on server side; more secure
const calculateOrderAmount = (items: CartProductType[]) => {
  const totalPrice: any = items.reduce((acc: any, item) => {
    const itemTotal = item.price * item.quantity;
    return acc + itemTotal;
  }, 0);

  // 0.00006666 error -> floored it
  const price: any = Math.floor(totalPrice);

  return price;
};

export async function POST(request: Request) {
  // Is there a user?
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.error();
  }

  // There is a user

  const body = await request.json();
  const { items, payment_intent_id } = body;
  // Create a payment_intent_id, store it in the local storage
  // then when we perform an update our shopping cart,
  // we can make use of that payment ID to update our payment intent
  // therefore we won't have to create many payment intents in Stripe
  const total = calculateOrderAmount(items) * 100; // * 100 to convert to cents

  const orderData = {
    // represents the order
    user: { connect: { id: currentUser.id } },
    amount: total,
    currency: "usd",
    status: "pending",
    deliveryStatus: "pending",
    paymentIntentId: payment_intent_id,
    products: items,
  };

  // Check if there is paymentIntentId
  if (payment_intent_id) {
    // Update the payment Intent
    const current_intent = await stripe.paymentIntents.retrieve(
      payment_intent_id
    );

    if (current_intent) {
      const updated_intent = await stripe.paymentIntents.update(
        payment_intent_id,
        { amount: total }
      );
      // Update the order
      const [existing_order, update_order] = await Promise.all([
        prisma.order.findFirst({
          where: { paymentIntentId: payment_intent_id },
        }),
        prisma.order.update({
          where: { paymentIntentId: payment_intent_id },
          data: {
            amount: total,
            products: items,
          },
        }),
      ]);

      // Check if there is existing order
      if (!existing_order) {
        return NextResponse.error();
      }
      return NextResponse.json({ paymentIntent: updated_intent });
    }
  } else {
    // We don't have a paymentIntentId
    // 1. Create the payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
    });

    // 2. Create the order
    // In order to create this order,
    // we will need to have order schema in Prisma
    // Done in schema.prisma

    // Before we createb our order,
    // we will update the payment intent that is at our order
    orderData.paymentIntentId = paymentIntent.id;

    await prisma.order.create({
      data: orderData,
    });

    return NextResponse.json({ paymentIntent });
  }

  // Return a default response (e.g., an error response) if none of the conditions are met
  return NextResponse.error();
}
