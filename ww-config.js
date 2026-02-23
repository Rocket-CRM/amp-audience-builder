export default {
  editor: {
    label: {
      en: 'Audience Builder',
    },
    icon: 'target',
    customSettingsPropertiesOrder: [
      'audiences',
      'collections',
      'audienceMembers',
      'audienceMembersTotal',
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
  ],
  triggerEvents: [
    {
      name: 'create-audience',
      label: { en: 'On Create Audience' },
      event: { p_name: '', p_description: '', p_conditions: {} },
      default: true,
    },
    {
      name: 'update-audience',
      label: { en: 'On Update Audience' },
      event: { p_audience_id: '', p_name: '', p_description: '', p_conditions: {} },
      default: true,
    },
    {
      name: 'delete-audience',
      label: { en: 'On Delete Audience' },
      event: { p_audience_id: '' },
      default: true,
    },
    {
      name: 'activate-audience',
      label: { en: 'On Activate Audience' },
      event: { p_audience_id: '', p_run_backfill: true },
      default: true,
    },
    {
      name: 'deactivate-audience',
      label: { en: 'On Deactivate Audience' },
      event: { p_audience_id: '' },
      default: true,
    },
    {
      name: 'load-members',
      label: { en: 'On Load Members' },
      event: { p_audience_id: '', p_limit: 50, p_offset: 0, p_include_exited: false },
      default: true,
    },
    {
      name: 'refresh-audiences',
      label: { en: 'On Refresh Audiences' },
      event: {},
      default: true,
    },
    {
      name: 'view-changed',
      label: { en: 'On View Changed' },
      event: { view: '', audienceId: '' },
      default: true,
    },
  ],
  properties: {
    audiences: {
      label: { en: 'Audiences Data' },
      type: 'Info',
      section: 'settings',
      options: {
        text: { en: 'Bind the audiences array from bff_list_audiences() → data' },
      },
      bindable: true,
      defaultValue: [],
      /* wwEditor:start */
      bindingValidation: {
        type: 'array',
        tooltip:
          'Array of audience objects: [{id, name, description, is_active, member_count, conditions, created_at, updated_at}]',
      },
      /* wwEditor:end */
    },
    collections: {
      label: { en: 'Collections Data' },
      type: 'Info',
      section: 'settings',
      options: {
        text: { en: 'Bind collections from bff_get_workflow_collections()' },
      },
      bindable: true,
      defaultValue: [],
      /* wwEditor:start */
      bindingValidation: {
        type: 'array',
        tooltip:
          'Array of collections: [{name, label, fields: [{name, label, type}], has_aggregate, aggregate_fields: [{name, label, type}]}]',
      },
      /* wwEditor:end */
    },
    audienceMembers: {
      label: { en: 'Audience Members' },
      type: 'Info',
      section: 'settings',
      options: {
        text: { en: 'Bind member data from bff_get_audience_members() → data' },
      },
      bindable: true,
      defaultValue: [],
      /* wwEditor:start */
      bindingValidation: {
        type: 'array',
        tooltip:
          'Array of member objects: [{user_id, full_name, phone_number, entered_at, exited_at}]',
      },
      /* wwEditor:end */
    },
    audienceMembersTotal: {
      label: { en: 'Members Total Count' },
      type: 'Number',
      section: 'settings',
      bindable: true,
      defaultValue: 0,
      /* wwEditor:start */
      bindingValidation: {
        type: 'number',
        tooltip: 'Total member count from bff_get_audience_members() → total',
      },
      /* wwEditor:end */
    },
  },
};
