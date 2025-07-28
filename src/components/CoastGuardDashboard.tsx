interface CoastGuardDashboardProps {
  boats: BoatData[];
  onSendMessage: (targetBoat: string, message: string, priority: 'low' | 'medium' | 'high') => void;
  onUpdateBoatStatus: (aisId: string, status: BoatData['status']) => void;
  messages: CoastGuardMessage[];
  liveTracking: boolean;
  onToggleLiveTracking: () => void;
}

const CoastGuardDashboard: React.FC<CoastGuardDashboardProps> = ({ 
  boats, 
  onSendMessage, 
  onUpdateBoatStatus,
  messages,
  liveTracking,
  onToggleLiveTracking
}) => {
}