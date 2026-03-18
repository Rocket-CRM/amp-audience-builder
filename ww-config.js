export default {
  editor: {
    label: {
      en: 'Audience Builder',
    },
    icon: 'target',
    customSettingsPropertiesOrder: [
      'authToken',
    ],
  },
  actions: [
    {
      name: 'navigateToList',
      label: { en: 'Navigate to List' },
      action: 'navigateToList',
      /* wwEditor:start */
      actionDescription: {
        en: 'Navigate to the audience list view',
      },
      /* wwEditor:end */
    },
    {
      name: 'navigateToBuilder',
      label: { en: 'Navigate to Builder' },
      action: 'navigateToBuilder',
      args: [
        {
          name: 'audienceData',
          type: 'Object',
          label: { en: 'Audience Data (optional, for editing)' },
          /* wwEditor:start */
          bindable: true,
          /* wwEditor:end */
        },
      ],
      /* wwEditor:start */
      actionDescription: {
        en: 'Navigate to the audience builder. Pass audience data to edit an existing audience, or omit to create new.',
      },
      /* wwEditor:end */
    },
    {
      name: 'navigateToDetail',
      label: { en: 'Navigate to Detail' },
      action: 'navigateToDetail',
      args: [
        {
          name: 'audienceId',
          type: 'Text',
          label: { en: 'Audience ID' },
          /* wwEditor:start */
          bindable: true,
          /* wwEditor:end */
        },
      ],
      /* wwEditor:start */
      actionDescription: {
        en: 'Navigate to the audience detail/members view',
      },
      /* wwEditor:end */
    },
    {
      name: 'refreshData',
      label: { en: 'Refresh All Data' },
      action: 'refreshData',
      /* wwEditor:start */
      actionDescription: {
        en: 'Reloads audiences and collections from the database',
      },
      /* wwEditor:end */
    },
  ],
  triggerEvents: [
    {
      name: 'audience-saved',
      label: { en: 'On Audience Saved' },
      event: { audience_id: '', name: '', action: 'created' },
      default: true,
      /* wwEditor:start */
      getTestEvent: '() => ({ audience_id: "uuid-123", name: "Test Audience", action: "created" })',
      /* wwEditor:end */
    },
    {
      name: 'audience-deleted',
      label: { en: 'On Audience Deleted' },
      event: { audience_id: '' },
      default: true,
      /* wwEditor:start */
      getTestEvent: '() => ({ audience_id: "uuid-123" })',
      /* wwEditor:end */
    },
    {
      name: 'audience-status-changed',
      label: { en: 'On Audience Status Changed' },
      event: { audience_id: '', is_active: false },
      default: true,
      /* wwEditor:start */
      getTestEvent: '() => ({ audience_id: "uuid-123", is_active: true })',
      /* wwEditor:end */
    },
    {
      name: 'view-changed',
      label: { en: 'On View Changed' },
      event: { view: '', audienceId: '' },
      default: true,
      /* wwEditor:start */
      getTestEvent: '() => ({ view: "builder", audienceId: "uuid-123" })',
      /* wwEditor:end */
    },
    {
      name: 'data-loaded',
      label: { en: 'On Data Loaded' },
      event: { audienceCount: 0 },
      default: true,
      /* wwEditor:start */
      getTestEvent: '() => ({ audienceCount: 5 })',
      /* wwEditor:end */
    },
    {
      name: 'error',
      label: { en: 'On Error' },
      event: { message: '', code: '' },
      default: true,
      /* wwEditor:start */
      getTestEvent: '() => ({ message: "Failed to save", code: "SAVE_ERROR" })',
      /* wwEditor:end */
    },
  ],
  properties: {
    // ─── Connection ────────────────────────────────────
    authToken: {
      label: { en: 'Auth Token (JWT)' },
      type: 'Text',
      section: 'settings',
      bindable: true,
      defaultValue: '',
      /* wwEditor:start */
      bindingValidation: {
        type: 'string',
        tooltip: 'Current admin user JWT. Bind to Supabase plugin access token.',
      },
      propertyHelp:
        "Bind to the current admin user's JWT from the Supabase auth session. This is the only binding required — all data is fetched automatically.",
      /* wwEditor:end */
    },
  },
};
