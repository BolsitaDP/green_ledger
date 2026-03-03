const defaultQuickLoginEmails = [
  'laura.admin@greenledger.com',
  'ana.compliance@greenledger.com',
  'camila.cultivation@greenledger.com',
  'diego.lab@greenledger.com',
]

export const envConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5105',
  enableDevLoginShortcuts: (import.meta.env.VITE_ENABLE_DEV_LOGIN_SHORTCUTS ?? 'false') === 'true',
  devLoginPassword: import.meta.env.VITE_DEV_LOGIN_PASSWORD ?? 'GreenLedger123!',
  devQuickLoginEmails:
    import.meta.env.VITE_DEV_QUICK_LOGIN_EMAILS?.split(',')
      .map((value: string) => value.trim())
      .filter(Boolean) ?? defaultQuickLoginEmails,
}
