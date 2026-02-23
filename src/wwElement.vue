<template>
  <div class="audience-root">
    <!-- List View -->
    <AudienceList
      v-if="currentViewValue === 'list'"
      :audiences="audiencesData"
      @create="handleCreateNew"
      @view="handleViewDetail"
      @edit="handleEdit"
      @toggle-status="handleToggleStatus"
      @delete="handleDelete"
      @refresh="handleRefresh"
    />

    <!-- Builder View (Create / Edit) -->
    <AudienceBuilder
      v-else-if="currentViewValue === 'builder'"
      :audience="editingAudienceObj"
      :collections="collectionsData"
      @save="handleSave"
      @cancel="handleBackToList"
    />

    <!-- Detail View -->
    <AudienceDetail
      v-else-if="currentViewValue === 'detail'"
      :audience="selectedAudienceObj"
      :members="membersData"
      :membersTotal="membersTotalData"
      @edit="handleEdit"
      @toggle-status="handleToggleStatus"
      @delete="handleDeleteFromDetail"
      @load-members="handleLoadMembers"
      @back="handleBackToList"
    />

    <!-- Editor Placeholder -->
    <div v-else class="editor-placeholder">
      <!-- wwEditor:start -->
      <div class="editor-placeholder__content">
        <div class="editor-placeholder__icon">🎯</div>
        <PolarisText variant="headingMd">Audience Builder</PolarisText>
        <PolarisText variant="bodySm" color="subdued">
          Bind <strong>Audiences Data</strong> and <strong>Collections Data</strong> in the settings panel to get started.
        </PolarisText>
        <div class="editor-placeholder__badges">
          <PolarisBadge variant="info">📋 List</PolarisBadge>
          <PolarisBadge variant="success">🛠 Builder</PolarisBadge>
          <PolarisBadge variant="attention">👥 Detail</PolarisBadge>
        </div>
      </div>
      <!-- wwEditor:end -->
    </div>
  </div>
</template>

<script>
import { computed, ref, watch } from 'vue';
import {
  PolarisText,
  PolarisBadge,
} from 'polaris-weweb-styles/components';
import AudienceList from './components/AudienceList.vue';
import AudienceBuilder from './components/AudienceBuilder.vue';
import AudienceDetail from './components/AudienceDetail.vue';

export default {
  components: {
    PolarisText,
    PolarisBadge,
    AudienceList,
    AudienceBuilder,
    AudienceDetail,
  },
  props: {
    uid: { type: String, required: true },
    content: { type: Object, required: true },
    /* wwEditor:start */
    wwEditorState: { type: Object, required: true },
    /* wwEditor:end */
  },
  emits: ['trigger-event'],
  setup(props, { emit, expose }) {
    const editingAudience = ref(null);

    // ── Internal Variables ──
    const { value: currentView, setValue: setCurrentView } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'currentView',
      type: 'string',
      defaultValue: 'list',
    });

    const { value: selectedAudienceId, setValue: setSelectedAudienceId } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'selectedAudienceId',
      type: 'string',
      defaultValue: '',
    });

    const { value: editingConditions, setValue: setEditingConditions } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'editingConditions',
      type: 'object',
      defaultValue: null,
    });

    const { value: hasUnsavedChanges, setValue: setHasUnsavedChanges } = wwLib.wwVariable.useComponentVariable({
      uid: props.uid,
      name: 'hasUnsavedChanges',
      type: 'boolean',
      defaultValue: false,
    });

    // ── Computed Data ──
    const currentViewValue = computed(() => currentView.value || 'list');

    const audiencesData = computed(() => {
      const data = props.content?.audiences;
      return Array.isArray(data) ? data : [];
    });

    const collectionsData = computed(() => {
      const data = props.content?.collections;
      return Array.isArray(data) ? data : [];
    });

    const membersData = computed(() => {
      const data = props.content?.audienceMembers;
      return Array.isArray(data) ? data : [];
    });

    const membersTotalData = computed(() => {
      return Number(props.content?.audienceMembersTotal) || 0;
    });

    const selectedAudienceObj = computed(() => {
      const id = selectedAudienceId.value;
      if (!id) return null;
      return audiencesData.value.find(a => a?.id === id) || null;
    });

    const editingAudienceObj = computed(() => editingAudience.value);

    // ── Navigation ──
    const navigateTo = (view, audienceId = '') => {
      setCurrentView(view);
      if (audienceId) {
        setSelectedAudienceId(audienceId);
      }
      emit('trigger-event', {
        name: 'view-changed',
        event: { view, audienceId },
      });
    };

    const handleBackToList = () => {
      editingAudience.value = null;
      setEditingConditions(null);
      setHasUnsavedChanges(false);
      navigateTo('list');
    };

    const handleCreateNew = () => {
      editingAudience.value = null;
      setEditingConditions(null);
      navigateTo('builder');
    };

    const handleEdit = (audience) => {
      editingAudience.value = audience ? { ...audience } : null;
      setEditingConditions(audience?.conditions || null);
      navigateTo('builder', audience?.id || '');
    };

    const handleViewDetail = (audience) => {
      navigateTo('detail', audience?.id || '');
    };

    // ── API Actions (emit trigger events) ──
    const handleSave = (payload) => {
      if (payload.audience_id) {
        emit('trigger-event', {
          name: 'update-audience',
          event: {
            audience_id: payload.audience_id,
            name: payload.name,
            description: payload.description,
            conditions: payload.conditions,
          },
        });
      } else {
        emit('trigger-event', {
          name: 'create-audience',
          event: {
            name: payload.name,
            description: payload.description,
            conditions: payload.conditions,
          },
        });
      }
      setHasUnsavedChanges(false);
    };

    const handleToggleStatus = (audience) => {
      if (audience?.is_active) {
        emit('trigger-event', {
          name: 'deactivate-audience',
          event: { audience_id: audience.id },
        });
      } else {
        emit('trigger-event', {
          name: 'activate-audience',
          event: { audience_id: audience.id, run_backfill: true },
        });
      }
    };

    const handleDelete = (audience) => {
      emit('trigger-event', {
        name: 'delete-audience',
        event: { audience_id: audience?.id },
      });
    };

    const handleDeleteFromDetail = (audience) => {
      handleDelete(audience);
      handleBackToList();
    };

    const handleRefresh = () => {
      emit('trigger-event', { name: 'refresh-audiences', event: {} });
    };

    const handleLoadMembers = (params) => {
      emit('trigger-event', {
        name: 'load-members',
        event: {
          audience_id: params?.audience_id || selectedAudienceId.value,
          limit: params?.limit || 50,
          offset: params?.offset || 0,
          include_exited: params?.include_exited || false,
        },
      });
    };

    // ── Exposed Actions (for Component Actions in WeWeb) ──
    const navigateToList = () => handleBackToList();

    const navigateToBuilder = (audienceData) => {
      if (audienceData && typeof audienceData === 'object' && audienceData.id) {
        handleEdit(audienceData);
      } else {
        handleCreateNew();
      }
    };

    const navigateToDetail = (audienceId) => {
      if (audienceId) {
        navigateTo('detail', audienceId);
      }
    };

    expose({
      navigateToList,
      navigateToBuilder,
      navigateToDetail,
    });

    // ── Watch audiences data for reactivity ──
    watch(
      () => [
        props.content?.audiences,
        props.content?.collections,
        props.content?.audienceMembers,
        props.content?.audienceMembersTotal,
      ],
      () => {
        // Reactivity handled via computed properties
      },
      { deep: true }
    );

    return {
      currentViewValue,
      audiencesData,
      collectionsData,
      membersData,
      membersTotalData,
      selectedAudienceObj,
      editingAudienceObj,
      handleBackToList,
      handleCreateNew,
      handleEdit,
      handleViewDetail,
      handleSave,
      handleToggleStatus,
      handleDelete,
      handleDeleteFromDetail,
      handleRefresh,
      handleLoadMembers,
    };
  },
};
</script>

<style lang="scss" scoped>
@import 'polaris-weweb-styles';

.audience-root {
  @include polaris-tokens;
  width: 100%;
  height: 100%;
  font-family: var(--p-font-family-sans);
  color: var(--p-color-text);
  background: var(--p-color-bg-surface-secondary);
  padding: var(--p-space-600) var(--p-space-800);
  overflow-y: auto;
  box-sizing: border-box;
}

.editor-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.editor-placeholder__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--p-space-300);
  text-align: center;
  max-width: 400px;
}

.editor-placeholder__icon {
  font-size: 48px;
}

.editor-placeholder__badges {
  display: flex;
  gap: var(--p-space-200);
  flex-wrap: wrap;
  justify-content: center;
  margin-top: var(--p-space-200);
}

@media (max-width: 768px) {
  .audience-root {
    padding: var(--p-space-400);
  }
}
</style>
