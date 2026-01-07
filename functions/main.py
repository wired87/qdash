import stripe
from firebase_functions import https_fn, options
from firebase_admin import initialize_app

initialize_app()

# Initialize Stripe with your secret key
# stripe.api_key = "sk_test_..." 

def calculate_adapted_price(compute_hours):
    # Example logic: $10 base + $5 per hour
    return 1000 + (compute_hours * 500) # in cents

@https_fn.on_call()
def get_payment_url(req: https_fn.CallableRequest):
    if not req.auth:
        raise https_fn.HttpsError(code=https_fn.FunctionsErrorCode.UNAUTHENTICATED, message="User must be authenticated")

    uid = req.auth.uid
    data = req.data
    plan_type = data.get("plan", "magician")
    compute_hours = data.get("compute_hours", 10)
    
    price_cents = calculate_adapted_price(compute_hours)
    
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': f'{plan_type.capitalize()} Plan',
                    },
                    'unit_amount': price_cents,
                },
                'quantity': 1
            }],
            mode='payment', # 'subscription' if recurring, 'payment' for one-time
            success_url='https://yourapp.com/success', # Update this with actual URL
            cancel_url='https://yourapp.com/cancel',
            client_reference_id=uid,
            metadata={"plan": plan_type, "compute_hours": compute_hours}
        )
        return {"url": session.url}
    except Exception as e:
        raise https_fn.HttpsError(code=https_fn.FunctionsErrorCode.INTERNAL, message=str(e))
