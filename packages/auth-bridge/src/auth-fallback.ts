/** 未登录兜底只选用户默认模型，或唯一可用模型；不随机挑选可能收费的供应商。 */
export function selectAuthenticationFallbackModel(preferred: string, models: string[]): string | undefined {
  if (preferred.trim() && models.includes(preferred.trim())) return preferred.trim();
  return models.length === 1 ? models[0] : undefined;
}
