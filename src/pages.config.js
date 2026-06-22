import Home from '@/pages/Home';
import Medications from '@/pages/Medications';
import AddMedication from '@/pages/AddMedication';
import Schedule from '@/pages/Schedule';
import Interactions from '@/pages/Interactions';
import Pharmacy from '@/pages/Pharmacy';
import Share from '@/pages/Share';
import SharedView from '@/pages/SharedView';
import EmergencyCard from '@/pages/EmergencyCard';
import Profile from '@/pages/Profile';

/* Page registry. Route paths are derived via createPageUrl(name). */
export const PAGES = {
  Home,
  Medications,
  AddMedication,
  Schedule,
  Interactions,
  Pharmacy,
  Share,
  SharedView,
  EmergencyCard,
  Profile
};

export const mainPage = 'Home';
