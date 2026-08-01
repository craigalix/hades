import { HadesCommand, HadesCommandType, HadesCommandSchema } from '../protocol/commands';
import { getTelegramWebApp } from './sdk';

const MAX_TELEGRAM_SEND_BYTES = 4096;

type SendCommandOptions<TPayload> = {
  type: HadesCommandType;
  payload: TPayload;
  ui?: HadesCommand['ui'];
};

export function buildHadesCommand<TPayload>({
  type,
  payload,
  ui,
}: SendCommandOptions<TPayload>): HadesCommand<TPayload> {
  return {
    v: 1,
    source: 'hades',
    commandId: crypto.randomUUID(),
    type,
    createdAt: new Date().toISOString(),
    payload,
    ui,
  };
}

export async function sendHadesCommand<TPayload>(options: SendCommandOptions<TPayload>): Promise<HadesCommand<TPayload>> {
  const command = buildHadesCommand(options);
  HadesCommandSchema.parse(command);

  const data = JSON.stringify(command);
  const byteLength = new TextEncoder().encode(data).byteLength;

  if (byteLength > MAX_TELEGRAM_SEND_BYTES) {
    throw new Error(`Command is ${byteLength} bytes, exceeding Telegram's ${MAX_TELEGRAM_SEND_BYTES} byte limit.`);
  }

  const miniApp = getTelegramWebApp();
  if (!miniApp?.sendData) {
    throw new Error('Telegram WebApp sendData is unavailable. Open HADES inside Telegram to send commands.');
  }

  miniApp.sendData(data);
  return command;
}
