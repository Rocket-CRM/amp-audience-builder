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
        <PolarisButton variant="plain" icon="arrowLeft" @click="$emit('refresh')">
          Refresh
        </PolarisButton>
        <PolarisButton variant="primary" @click="$emit('create')">
          Create audience
        </PolarisButton>
      </div>
    </div>

    <!-- Table -->
    <div v-if="safeAudiences.length" class="list-table-wrap">
      <table class="list-table">
        <thead>
          <tr>
            <th class="col-name">Name</th>
            <th class="col-desc">Description</th>
            <th class="col-status">Status</th>
            <th class="col-members">Members</th>
            <th class="col-date">Created</th>
            <th class="col-actions">Actions</th>
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
              <!-- Confirm Delete Inline -->
              <div v-if="confirmDeleteId === audience?.id" class="confirm-inline">
                <PolarisText variant="bodySm" color="critical">Delete this audience?</PolarisText>
                <PolarisButton variant="critical" size="slim" @click="confirmDelete(audience)">
                  Yes, delete
                </PolarisButton>
                <PolarisButton size="slim" @click="confirmDeleteId = null">Cancel</PolarisButton>
              </div>
              <!-- Confirm Activate Inline -->
              <div v-else-if="confirmActivateId === audience?.id" class="confirm-inline">
                <PolarisText variant="bodySm">
                  {{ audience?.is_active ? 'Deactivate?' : 'Activate and evaluate all users?' }}
                </PolarisText>
                <PolarisButton variant="primary" size="slim" @click="confirmToggle(audience)">
                  Confirm
                </PolarisButton>
                <PolarisButton size="slim" @click="confirmActivateId = null">Cancel</PolarisButton>
              </div>
              <!-- Normal Actions -->
              <div v-else class="action-buttons">
                <PolarisButton variant="plain" size="slim" @click="$emit('edit', audience)">
                  Edit
                </PolarisButton>
                <PolarisButton variant="plain" size="slim" @click="confirmActivateId = audience?.id">
                  {{ audience?.is_active ? 'Deactivate' : 'Activate' }}
                </PolarisButton>
                <PolarisButton
                  variant="plain"
                  size="slim"
                  :disabled="audience?.is_active"
                  @click="confirmDeleteId = audience?.id"
                >
                  Delete
                </PolarisButton>
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
          <PolarisButton variant="primary" @click="$emit('create')">
            Create audience
          </PolarisButton>
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
  components: {
    PolarisText,
    PolarisButton,
    PolarisBadge,
    PolarisEmptyState,
  },
  props: {
    audiences: { type: Array, default: () => [] },
  },
  emits: ['create', 'view', 'edit', 'toggle-status', 'delete', 'refresh'],
  setup(props, { emit }) {
    const confirmDeleteId = ref(null);
    const confirmActivateId = ref(null);

    const safeAudiences = computed(() => {
      return Array.isArray(props.audiences) ? props.audiences : [];
    });

    const formatDate = (dateStr) => {
      if (!dateStr) return '—';
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } catch {
        return dateStr;
      }
    };

    const formatNumber = (num) => {
      if (num == null) return '0';
      return Number(num).toLocaleString();
    };

    const confirmDelete = (audience) => {
      confirmDeleteId.value = null;
      emit('delete', audience);
    };

    const confirmToggle = (audience) => {
      confirmActivateId.value = null;
      emit('toggle-status', audience);
    };

    return {
      safeAudiences,
      confirmDeleteId,
      confirmActivateId,
      formatDate,
      formatNumber,
      confirmDelete,
      confirmToggle,
    };
  },
};
</script>

<style lang="scss" scoped>
.audience-list {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-400);
  height: 100%;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--p-space-300);
}

.list-header__title {
  display: flex;
  align-items: baseline;
  gap: var(--p-space-200);
}

.list-header__actions {
  display: flex;
  gap: var(--p-space-200);
}

.list-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--p-color-border);
  border-radius: var(--p-border-radius-200);
  background: var(--p-color-bg-surface);
  box-shadow: var(--p-shadow-card);
}

.list-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--p-font-size-350);

  th,
  td {
    padding: var(--p-space-300) var(--p-space-400);
    text-align: left;
    white-space: nowrap;
  }

  th {
    font-weight: var(--p-font-weight-semibold);
    color: var(--p-color-text-secondary);
    font-size: var(--p-font-size-300);
    background: var(--p-color-bg-surface-secondary);
    border-bottom: 1px solid var(--p-color-border);
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  td {
    border-bottom: 1px solid var(--p-color-border);
    vertical-align: middle;
  }

  tr:last-child td {
    border-bottom: none;
  }
}

.list-table__row:hover {
  background: var(--p-color-bg-surface-hover);
}

.col-desc {
  max-width: 300px;
}

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

  &:hover {
    text-decoration: underline;
  }
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
}

@media (max-width: 768px) {
  .list-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
