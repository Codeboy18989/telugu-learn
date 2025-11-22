// useModeLabels - Provides context-aware labels based on user mode
import { useUserMode } from '../context/UserModeContext';

export function useModeLabels() {
  const { mode } = useUserMode();

  const labels = {
    family: {
      // Dashboard
      dashboardTitle: 'Family Learning Dashboard',

      // Learner labels
      learner: 'Family Member',
      learnerPlural: 'Family Members',
      learnerPossessive: "Family Member's",
      addLearner: '+ Add Family Member',
      addLearnerTitle: '👨‍👩‍👧 Add Family Member',
      yourLearners: '🌟 Your Family Members',
      manageLearners: 'Manage Family Members',
      noLearnersYet: 'No family members added yet',
      addFirstLearner: 'Add your first family member to start learning',
      emptyState: 'No family members added yet. Add your first family member above! 👶',

      // Learning
      learningTitle: 'Family Learning',
      learningWith: 'Learning with',
      selectLearner: 'Select a family member to start learning',

      // Progress/Reports
      progressTitle: 'Family Progress',

      // Dashboard tabs
      tab1: '👨‍👩‍👧 Family Members',
      tab2: '📚 Content Library',
      tab3: '🎓 Learn'
    },

    teacher: {
      // Dashboard
      dashboardTitle: 'Teacher Dashboard',

      // Learner labels
      learner: 'Student',
      learnerPlural: 'Students',
      learnerPossessive: "Student's",
      addLearner: '+ Add Student',
      addLearnerTitle: '👨‍🏫 Add Student',
      yourLearners: '🎓 Your Students',
      manageLearners: 'Manage Students',
      noLearnersYet: 'No students added yet',
      addFirstLearner: 'Add your first student to start teaching',
      emptyState: 'No students added yet. Add your first student above! 📚',

      // Learning
      learningTitle: 'Classroom',
      learningWith: 'Teaching',
      selectLearner: 'Select a student to start teaching',

      // Progress/Reports
      progressTitle: 'Class Reports',

      // Dashboard tabs
      tab1: '👨‍🏫 Students',
      tab2: '📚 Content Library',
      tab3: '🎓 Learn'
    },

    friends: {
      // Dashboard
      dashboardTitle: 'Learning Group',

      // Learner labels
      learner: 'Learning Partner',
      learnerPlural: 'Learning Partners',
      learnerPossessive: "Learning Partner's",
      addLearner: '+ Invite Friend',
      addLearnerTitle: '👥 Invite Learning Partner',
      yourLearners: '🤝 Your Learning Partners',
      manageLearners: 'Learning Partners',
      noLearnersYet: 'No learning partners yet',
      addFirstLearner: 'Invite friends to learn together',
      emptyState: 'No learning partners yet. Invite your first friend above! 👥',

      // Learning
      learningTitle: 'Group Learning',
      learningWith: 'Learning with',
      selectLearner: 'Select a learning partner',

      // Progress/Reports
      progressTitle: 'Group Progress',

      // Dashboard tabs
      tab1: '👥 Learning Partners',
      tab2: '📚 Content Library',
      tab3: '🎓 Learn'
    }
  };

  return labels[mode] || labels.family;
}
