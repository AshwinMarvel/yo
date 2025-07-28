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
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-2" />
                    {liveTracking ? (
                      <span className="text-green-600 font-medium">
                        {formatTime(boat.lastUpdate)} (Live)
                      </span>
                    ) : (
                      formatTime(boat.lastUpdate)
                    )}
                  </div>
                </div>