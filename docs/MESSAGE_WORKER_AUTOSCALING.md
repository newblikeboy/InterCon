# Message Worker Autoscaling

The message worker autoscaler keeps a minimum number of PM2 message workers
running and scales up when the outbound WhatsApp queue grows.

## Defaults

```env
MESSAGE_WORKER_PM2_NAME=intercon-worker
MESSAGE_AUTOSCALE_MIN_WORKERS=2
MESSAGE_AUTOSCALE_MAX_WORKERS=50
MESSAGE_AUTOSCALE_MESSAGES_PER_WORKER=100
MESSAGE_AUTOSCALE_WORKERS_PER_ACTIVE_PHONE=1
MESSAGE_AUTOSCALE_INTERVAL_MS=60000
MESSAGE_AUTOSCALE_DOWN_IDLE_MS=300000
```

With these defaults:

- no queue: `2` message workers
- `1,000` queued/processing messages: about `10` workers
- `5,000` queued/processing messages: about `50` workers
- `50` active sender phones: at least `50` workers, capped by max workers

Redis must be enabled before scaling workers. Redis coordinates per-phone send
slots and daily unique-recipient counters across worker processes.

## PM2 Setup

On the droplet:

```bash
cd /opt/InterCon
pm2 scale intercon-worker 2
pm2 start npm --name intercon-worker-autoscaler -- run worker:messages:autoscale
pm2 save
```

If PM2 refuses to scale because the existing worker was created in fork mode,
recreate only the message worker as an instanced PM2 app:

```bash
pm2 delete intercon-worker
pm2 start src/workers/messageQueue.worker.js --name intercon-worker -i 2
pm2 start npm --name intercon-worker-autoscaler -- run worker:messages:autoscale
pm2 save
```

Check status:

```bash
pm2 list
pm2 logs intercon-worker-autoscaler --lines 50
pgrep -af "messageQueue.worker.js" | wc -l
```

Stop autoscaling:

```bash
pm2 stop intercon-worker-autoscaler
```
