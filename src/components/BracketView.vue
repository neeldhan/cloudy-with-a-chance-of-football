<template>
  <div>
    <div class="bracket">
      <section class="round" v-for="round in bracketData" :key="round.id">
        <h2 class="round-title">{{ round.name }}</h2>
        <div class="round-dates">{{ round.dateRange }}</div>
        <KnockoutMatch
          v-for="match in round.matches"
          :key="match.matchNumber"
          :match="match"
          :assignments="mergedAssignments"
          :scores="scores"
          @edit-slot="openEditor"
        />
      </section>
    </div>

    <SlotEditor
    :visible="editorVisible"
    :slot-code="editingSlot"
    :current-value="editingSlot ? (mergedAssignments[editingSlot] || '') : ''"
    @save="saveSlot"
    @clear="clearSlot"
    @close="closeEditor"
  />
  </div>
</template>

<script>
import { bracketData }       from '../data/bracket.js'
import { deriveAssignments } from '../utils/bracketProgression.js'
import KnockoutMatch          from './KnockoutMatch.vue'
import SlotEditor             from './SlotEditor.vue'

export default {
  components: { KnockoutMatch, SlotEditor },

  props: {
    scores: { type: Object, default: () => ({}) },
  },

  data() {
    return {
      bracketData,
      slotAssignments: {},
      editorVisible:   false,
      editingSlot:     null,
    }
  },

  computed: {
    mergedAssignments() {
      // Auto-derived assignments (from real results) take precedence;
      // manual assignments fill gaps (e.g. 3rd-place slots we can't compute).
      return { ...this.slotAssignments, ...deriveAssignments(this.scores) }
    },
  },

  mounted() {
    try {
      const raw = localStorage.getItem('wc26SlotAssignments')
      this.slotAssignments = raw ? JSON.parse(raw) : {}
    } catch {
      this.slotAssignments = {}
    }
  },

  methods: {
    openEditor(slotCode) {
      this.editingSlot   = slotCode
      this.editorVisible = true
    },

    closeEditor() {
      this.editorVisible = false
      this.editingSlot   = null
    },

    saveSlot({ slotCode, value }) {
      const updated = { ...this.slotAssignments }
      if (value.trim()) {
        updated[slotCode] = value.trim()
      } else {
        delete updated[slotCode]
      }
      this.slotAssignments = updated
      this.persist()
      this.closeEditor()
    },

    clearSlot(slotCode) {
      const updated = { ...this.slotAssignments }
      delete updated[slotCode]
      this.slotAssignments = updated
      this.persist()
      this.closeEditor()
    },

    persist() {
      try {
        localStorage.setItem('wc26SlotAssignments', JSON.stringify(this.slotAssignments))
      } catch { /* storage unavailable */ }
    },
  },
}
</script>
