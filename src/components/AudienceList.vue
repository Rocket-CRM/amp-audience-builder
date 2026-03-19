<template>
  <div class="audience-list">
    <!-- Header -->
    <div class="list-header">
      <div class="list-header__title">
        <PolarisText variant="headingLg">Audiences</PolarisText>
        <PolarisText variant="bodySm" color="subdued">
          {{ safeAudiences.length }} audience{{ safeAudiences.length !== 1 ? 's' : '' }}
        </PolarisText>
      </div>
      <div class="list-header__actions">
        <PolarisButton variant="plain" iconOnly @click="$emit('refresh')">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4"/><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"/></svg>
        </PolarisButton>
        <PolarisButton variant="primary" icon="plus" @click="$emit('create')">
          Create audience
        </PolarisButton>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="list-loading">
      <span class="spinner"></span>
      <PolarisText variant="bodyMd" color="subdued">Loading audiences...</PolarisText>
    </div>

    <!-- Table -->
    <div v-else-if="safeAudiences.length" class="list-table-wrap">
      <table class="list-table">
        <thead>
          <tr>
            <th class="col-name th--first">Name</th>
            <th class="col-desc">Description</th>
            <th class="col-status">Status</th>
            <th class="col-members">Members</th>
            <th class="col-date">Created</th>
            <th class="col-actions th--last">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="audience in safeAudiences"
            :key="audience?.id"
            class="list-table__row"
          >
            <td class="col-name">
              <button class="name-link" @click="$emit('view', audience)">
                {{ audience?.name || 'Untitled' }}
              </button>
            </td>
            <td class="col-desc">
              <span class="desc-text">{{ audience?.description || '—' }}</span>
            </td>
            <td class="col-status">
              <PolarisBadge :variant="audience?.is_active ? 'success' : 'default'">
                {{ audience?.is_active ? 'Active' : 'Inactive' }}
              </PolarisBadge>
            </td>
            <td class="col-members">
              {{ formatNumber(audience?.member_count) }}
            </td>
            <td class="col-date">
              {{ formatDate(audience?.created_at) }}
            </td>
            <td class="col-actions">
              <div v-if="confirmDeleteId === audience?.id" class="confirm-inline">
                <template v-if="audience?.is_active">
                  <PolarisText variant="bodySm" color="critical">Deactivate the audience before deleting.</PolarisText>
                  <PolarisButton size="slim" @click="confirmDeleteId = null">OK</PolarisButton>
                </template>
                <template v-else>
                  <PolarisText variant="bodySm" color="critical">Delete this audience? This cannot be undone.</PolarisText>
                  <PolarisButton variant="critical" size="slim" @click="confirmDelete(audience)">Yes, delete</PolarisButton>
                  <PolarisButton size="slim" @click="confirmDeleteId = null">Cancel</PolarisButton>
                </template>
              </div>
              <div v-else-if="confirmActivateId === audience?.id" class="confirm-inline">
                <PolarisText variant="bodySm">
                  {{ audience?.is_active
                    ? 'Deactivate this audience? Existing members will remain.'
                    : 'Activate and run backfill? This will evaluate all existing users and add qualifying members.' }}
                </PolarisText>
                <PolarisButton variant="primary" size="slim" @click="confirmToggle(audience)">Confirm</PolarisButton>
                <PolarisButton size="slim" @click="confirmActivateId = null">Cancel</PolarisButton>
              </div>
              <div v-else class="action-buttons">
                <PolarisButton variant="plain" size="slim" @click="$emit('edit', audience)">Edit</PolarisButton>
                <PolarisButton variant="plain" size="slim" @click="confirmActivateId = audience?.id">
                  {{ audience?.is_active ? 'Deactivate' : 'Activate' }}
                </PolarisButton>
                <PolarisButton variant="plain" size="slim" @click="confirmDeleteId = audience?.id">Delete</PolarisButton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State -->
    <div v-else class="list-empty">
      <PolarisEmptyState heading="No audiences yet" icon="👥">
        Create your first audience to start segmenting users based on conditions.
        <template #actions>
          <PolarisButton variant="primary" @click="$emit('create')">Create audience</PolarisButton>
        </template>
      </PolarisEmptyState>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue';
import {
  PolarisText,
  PolarisButton,
  PolarisBadge,
  PolarisEmptyState,
} from 'polaris-weweb-styles/components';

export default {
  name: 'AudienceList',
  components: { PolarisText, PolarisButton, PolarisBadge, PolarisEmptyState },
  props: {
    audiences: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
  },
  emits: ['create', 'view', 'edit', 'toggle-status', 'delete', 'refresh'],
  setup(props, { emit }) {
    const confirmDeleteId = ref(null);
    const confirmActivateId = ref(null);
    const safeAudiences = computed(() => Array.isArray(props.audiences) ? props.audiences : []);
    const formatDate = (dateStr) => {
      if (!dateStr) return '—';
      try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
      catch { return dateStr; }
    };
    const formatNumber = (num) => { if (num == null) return '0'; return Number(num).toLocaleString(); };
    const confirmDelete = (audience) => { confirmDeleteId.value = null; emit('delete', audience); };
    const confirmToggle = (audience) => { confirmActivateId.value = null; emit('toggle-status', audience); };
    return { safeAudiences, confirmDeleteId, confirmActivateId, formatDate, formatNumber, confirmDelete, confirmToggle };
  },
};
</script>

<style lang="scss" scoped>
@import 'polaris-weweb-styles';

.audience-list {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-400);
  height: 100%;
  background: transparent;
  padding: var(--p-space-600) var(--p-space-500);
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--p-space-300);
  background: transparent;
}

.list-header__title {
  display: flex;
  align-items: baseline;
  gap: var(--p-space-200);
}

.list-header__actions {
  display: flex;
  align-items: center;
  gap: var(--p-space-200);
  margin-left: auto;
  flex-shrink: 0;
}

.list-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--p-space-300);
  padding: var(--p-space-800) 0;
  background: var(--p-color-bg-surface);
  border: 1px solid var(--p-color-border);
  border-radius: var(--p-border-radius-300);
}

.spinner {
  @include polaris-spinner;
}

.list-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--p-color-border);
  border-radius: var(--p-border-radius-300);
  background: var(--p-color-bg-surface);
}

.list-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--p-font-size-325);

  th, td {
    padding: var(--p-space-300) var(--p-space-400);
    text-align: left;
    white-space: nowrap;
  }

  th {
    font-weight: var(--p-font-weight-semibold);
    color: var(--p-color-text-secondary);
    font-size: var(--p-font-size-275);
    background: var(--p-color-bg-surface-secondary);
    border-bottom: 1px solid var(--p-color-border);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .th--first { border-top-left-radius: var(--p-border-radius-300); }
  .th--last { border-top-right-radius: var(--p-border-radius-300); }

  td {
    border-bottom: 1px solid var(--p-color-border);
    vertical-align: middle;
  }

  tr:last-child td { border-bottom: none; }
}

.list-table__row:hover {
  background: var(--p-color-bg-surface-hover);
}

.col-desc { max-width: 300px; }

.desc-text {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--p-color-text-secondary);
}

.name-link {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  color: var(--p-color-text-brand);
  font-weight: var(--p-font-weight-semibold);
  cursor: pointer;
  text-decoration: none;
  &:hover { text-decoration: underline; }
}

.action-buttons {
  display: flex;
  gap: var(--p-space-100);
}

.confirm-inline {
  display: flex;
  align-items: center;
  gap: var(--p-space-200);
}

.list-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  background: var(--p-color-bg-surface);
  border: 1px solid var(--p-color-border);
  border-radius: var(--p-border-radius-300);
}

@media (max-width: 768px) {
  .audience-list { padding: var(--p-space-400); }
  .list-header { flex-direction: column; align-items: flex-start; }
  .list-header__actions { margin-left: 0; }
}
</style>
