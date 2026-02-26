<template>
  <div class="audience-detail">
    <!-- Header -->
    <div class="detail-header">
      <div class="detail-header__left">
        <PolarisButton variant="plain" icon="arrowLeft" @click="$emit('back')">
          Back
        </PolarisButton>
        <PolarisText variant="headingLg">{{ audience?.name || 'Audience Detail' }}</PolarisText>
        <PolarisBadge :variant="audience?.is_active ? 'success' : 'default'">
          {{ audience?.is_active ? 'Active' : 'Inactive' }}
        </PolarisBadge>
      </div>
      <div class="detail-header__right">
        <PolarisButton @click="$emit('edit', audience)">Edit</PolarisButton>
      </div>
    </div>

    <div class="detail-content">
      <!-- Overview Card -->
      <PolarisCard>
        <PolarisCardSection>
          <PolarisText v-if="audience?.description" variant="bodyMd" color="subdued">
            {{ audience?.description }}
          </PolarisText>
          <div class="detail-stats">
            <div class="stat-item">
              <PolarisText variant="bodySm" color="subdued">Members</PolarisText>
              <PolarisText variant="headingMd">{{ formatNumber(audience?.member_count) }}</PolarisText>
            </div>
            <div class="stat-item">
              <PolarisText variant="bodySm" color="subdued">Created</PolarisText>
              <PolarisText variant="bodyMd">{{ formatDate(audience?.created_at) }}</PolarisText>
            </div>
            <div class="stat-item">
              <PolarisText variant="bodySm" color="subdued">Updated</PolarisText>
              <PolarisText variant="bodyMd">{{ formatDate(audience?.updated_at) }}</PolarisText>
            </div>
          </div>
        </PolarisCardSection>
      </PolarisCard>

      <!-- Actions Card -->
      <PolarisCard>
        <PolarisCardSection>
          <PolarisBlockStack gap="300">
            <PolarisInline gap="200">
              <PolarisButton
                v-if="!showActivateConfirm"
                :variant="audience?.is_active ? 'outline' : 'primary'"
                @click="showActivateConfirm = true"
              >
                {{ audience?.is_active ? 'Deactivate' : 'Activate' }}
              </PolarisButton>

              <PolarisButton
                v-if="!showDeleteConfirm"
                variant="critical"
                @click="showDeleteConfirm = true"
              >
                Delete
              </PolarisButton>
            </PolarisInline>

            <PolarisBanner
              v-if="showActivateConfirm"
              :variant="audience?.is_active ? 'warning' : 'info'"
              dismissible
              @dismiss="showActivateConfirm = false"
            >
              {{ audience?.is_active
                ? 'Deactivating will stop evaluating new users. Existing members will remain.'
                : 'This will activate the audience and run a backfill — evaluating all existing users against the conditions and adding qualifying members. Continue?' }}
              <template #actions>
                <PolarisButton
                  :variant="audience?.is_active ? 'critical' : 'primary'"
                  size="slim"
                  @click="handleToggleConfirm"
                >
                  {{ audience?.is_active ? 'Yes, deactivate' : 'Yes, activate' }}
                </PolarisButton>
              </template>
            </PolarisBanner>

            <PolarisBanner
              v-if="showDeleteConfirm && audience?.is_active"
              variant="critical"
              dismissible
              @dismiss="showDeleteConfirm = false"
            >
              Deactivate the audience before deleting.
            </PolarisBanner>
            <PolarisBanner
              v-else-if="showDeleteConfirm"
              variant="critical"
              dismissible
              @dismiss="showDeleteConfirm = false"
            >
              Are you sure you want to delete this audience? This cannot be undone.
              <template #actions>
                <PolarisButton variant="critical" size="slim" @click="handleDeleteConfirm">
                  Yes, delete
                </PolarisButton>
              </template>
            </PolarisBanner>
          </PolarisBlockStack>
        </PolarisCardSection>
      </PolarisCard>

      <!-- Members Card -->
      <div class="members-section">
        <div class="members-header">
          <PolarisText variant="headingMd">Members</PolarisText>
          <PolarisCheckbox
            :modelValue="includeExited"
            @update:modelValue="handleExitedToggle"
            label="Include exited members"
          />
        </div>

        <div v-if="safeMembers.length" class="members-table-wrap">
          <table class="members-table">
            <thead>
              <tr>
                <th class="th--first">User</th>
                <th>Phone</th>
                <th>Entered</th>
                <th v-if="includeExited" class="th--last">Exited</th>
                <th v-else class="th--last"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="member in safeMembers" :key="member?.user_id">
                <td>{{ member?.full_name || member?.user_id || '—' }}</td>
                <td>{{ member?.phone_number || '—' }}</td>
                <td>{{ formatDate(member?.entered_at) }}</td>
                <td v-if="includeExited">
                  <PolarisBadge v-if="member?.exited_at" variant="default">
                    {{ formatDate(member?.exited_at) }}
                  </PolarisBadge>
                  <PolarisBadge v-else variant="success">Active</PolarisBadge>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="hasMore" class="members-pagination">
            <PolarisButton variant="plain" @click="loadMore">
              Load more ({{ safeMembers.length }} of {{ membersTotal }})
            </PolarisButton>
          </div>
        </div>

        <div v-else class="members-empty">
          <PolarisEmptyState
            heading="No members yet"
            icon="👤"
            compact
          >
            {{ audience?.is_active
              ? 'Members will appear here as users qualify.'
              : 'Activate this audience to start evaluating users.' }}
          </PolarisEmptyState>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, watch } from 'vue';
import {
  PolarisText,
  PolarisButton,
  PolarisCard,
  PolarisCardSection,
  PolarisInline,
  PolarisBlockStack,
  PolarisBadge,
  PolarisBanner,
  PolarisCheckbox,
  PolarisEmptyState,
} from 'polaris-weweb-styles/components';

export default {
  name: 'AudienceDetail',
  components: {
    PolarisText,
    PolarisButton,
    PolarisCard,
    PolarisCardSection,
    PolarisInline,
    PolarisBlockStack,
    PolarisBadge,
    PolarisBanner,
    PolarisCheckbox,
    PolarisEmptyState,
  },
  props: {
    audience: { type: Object, default: () => ({}) },
    members: { type: Array, default: () => [] },
    membersTotal: { type: Number, default: 0 },
  },
  emits: ['back', 'edit', 'toggle-status', 'delete', 'load-members'],
  setup(props, { emit }) {
    const includeExited = ref(false);
    const showActivateConfirm = ref(false);
    const showDeleteConfirm = ref(false);
    const currentOffset = ref(0);
    const PAGE_SIZE = 50;

    const safeMembers = computed(() => {
      return Array.isArray(props.members) ? props.members : [];
    });

    const hasMore = computed(() => {
      return safeMembers.value.length < (props.membersTotal || 0);
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

    const requestMembers = (offset = 0) => {
      emit('load-members', {
        audience_id: props.audience?.id,
        limit: PAGE_SIZE,
        offset,
        include_exited: includeExited.value,
      });
    };

    const handleExitedToggle = (val) => {
      includeExited.value = val;
      currentOffset.value = 0;
      requestMembers(0);
    };

    const loadMore = () => {
      currentOffset.value = safeMembers.value.length;
      requestMembers(safeMembers.value.length);
    };

    const handleToggleConfirm = () => {
      showActivateConfirm.value = false;
      emit('toggle-status', props.audience);
    };

    const handleDeleteConfirm = () => {
      showDeleteConfirm.value = false;
      emit('delete', props.audience);
    };

    watch(() => props.audience?.id, (newId) => {
      if (newId) {
        currentOffset.value = 0;
        includeExited.value = false;
        showActivateConfirm.value = false;
        showDeleteConfirm.value = false;
        requestMembers(0);
      }
    }, { immediate: true });

    return {
      includeExited,
      showActivateConfirm,
      showDeleteConfirm,
      safeMembers,
      hasMore,
      formatDate,
      formatNumber,
      handleExitedToggle,
      loadMore,
      handleToggleConfirm,
      handleDeleteConfirm,
    };
  },
};
</script>

<style lang="scss" scoped>
.audience-detail {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-400);
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--p-space-300) var(--p-space-600);
  margin: calc(-1 * var(--p-space-600)) calc(-1 * var(--p-space-800)) 0;
  background: var(--p-color-bg-surface);
  border-bottom: 1px solid var(--p-color-border);
  box-shadow: 0 1px 0 0 rgba(0, 0, 0, 0.04);
  flex-shrink: 0;
}

.detail-header__left {
  display: flex;
  align-items: center;
  gap: var(--p-space-300);
}

.detail-header__right {
  display: flex;
  gap: var(--p-space-200);
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-400);
}

.detail-stats {
  display: flex;
  gap: var(--p-space-800);
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-100);
}

.members-section {
  display: flex;
  flex-direction: column;
  gap: var(--p-space-300);
}

.members-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--p-space-200);
}

.members-table-wrap {
  border: 1px solid var(--p-color-border);
  border-radius: var(--p-border-radius-300);
  background: var(--p-color-bg-surface);
}

.members-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--p-font-size-325);

  th,
  td {
    padding: var(--p-space-300) var(--p-space-400);
    text-align: left;
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

  .th--first {
    border-top-left-radius: var(--p-border-radius-300);
  }

  .th--last {
    border-top-right-radius: var(--p-border-radius-300);
  }

  td {
    border-bottom: 1px solid var(--p-color-border);
  }

  tr:last-child td {
    border-bottom: none;
  }
}

.members-pagination {
  padding: var(--p-space-300);
  text-align: center;
  border-top: 1px solid var(--p-color-border);
}

.members-empty {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--p-color-bg-surface);
  border: 1px solid var(--p-color-border);
  border-radius: var(--p-border-radius-300);
}

@media (max-width: 768px) {
  .detail-header {
    margin: calc(-1 * var(--p-space-400)) calc(-1 * var(--p-space-400)) 0;
    padding: var(--p-space-300) var(--p-space-400);
  }
}
</style>
