-- Enable the pg_net extension to allow making HTTP requests
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- Create a function that will be called by the trigger
CREATE OR REPLACE FUNCTION notify_order_closed()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the order status changed to 'FECHADO'
  IF NEW.status = 'FECHADO' AND (OLD.status IS NULL OR OLD.status != 'FECHADO') THEN
    -- Make an HTTP POST request to the webhook URL
    -- Replace 'YOUR_WEBHOOK_URL' with your actual endpoint
    PERFORM net.http_post(
      url := 'https://tasca-do-vereda.vercel.app/api/webhooks/order-closed',
      body := jsonb_build_object(
        'order_id', NEW.id,
        'total', NEW.total,
        'closed_at', NOW()
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS on_order_closed_webhook ON orders;
CREATE TRIGGER on_order_closed_webhook
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_closed();
