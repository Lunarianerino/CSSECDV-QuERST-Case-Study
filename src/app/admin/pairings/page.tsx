"use client";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MatchStatus } from "@/models/match";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Loader2, Search, SquarePlus } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import UserSelectionModal from "@/components/pairings/UserSelectionModal";
import { createPairing, getAllPairings, updatePairingStatus, deletePairing, PairingDetailed } from "@/lib/actions/pairingActions";
import { toast } from "sonner";


// Using the types from pairingActions
type Pairing = PairingDetailed;

type NewMatch = {
  studentId: string;
  tutorId: string;
  subject: string; 
  status: MatchStatus;
}




// Helper functions to check pairing status
const isPendingPairing = (pairing: Pairing) => pairing.status === MatchStatus.PENDING;
const isAcceptedPairing = (pairing: Pairing) => pairing.status === MatchStatus.ACCEPTED;
const isOngoingPairing = (pairing: Pairing) => pairing.status === MatchStatus.ONGOING;
const isCompletedPairing = (pairing: Pairing) => pairing.status === MatchStatus.COMPLETED;
const isCancelledPairing = (pairing: Pairing) => pairing.status === MatchStatus.CANCELLED;
const isRejectedPairing = (pairing: Pairing) => pairing.status === MatchStatus.REJECTED;

// For the dialog, we'll consider "active" to be ACCEPTED or ONGOING
const isActivePairing = (pairing: Pairing) => 
  pairing.status === MatchStatus.ACCEPTED || pairing.status === MatchStatus.ONGOING;

// For the dialog, we'll consider "issue" to be REJECTED or CANCELLED
const isIssuePairing = (pairing: Pairing) => 
  pairing.status === MatchStatus.REJECTED || pairing.status === MatchStatus.CANCELLED;

const Page = () => {
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreatePairingOpen, setIsCreatePairingOpen] = useState(false);
  const [selectedPairing, setSelectedPairing] = useState<Pairing | null>(null);
  const [selectedTutor, setSelectedTutor] = useState<any>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [newPairingSubject, setNewPairingSubject] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  
  // Fetch all pairings on component mount
  useEffect(() => {
    const fetchPairings = async () => {
      try {
        setIsLoading(true);
        const data = await getAllPairings();
        setPairings(data);
        setError(null);
      } catch (error) {
        console.error('Failed to fetch pairings:', error);
        setError('Failed to load pairings. Please try again.');
        toast.error('Failed to load pairings. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPairings();
  }, []);
  
  const filteredPairings = pairings.filter(pairing => {
    const matchesSearch =
      pairing.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pairing.tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pairing.subject.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      statusFilter === "all" ||
      pairing.status === statusFilter;

    return matchesSearch && matchesFilter;
  });
  
  const handleOpenDetails = (pairing: Pairing) => {
    setSelectedPairing(pairing);
    setIsDetailsOpen(true);
  }

  const handleOpenCreatePairing = () => {
    // Reset the form state when opening the dialog
    setSelectedTutor(null);
    setSelectedStudent(null);
    setNewPairingSubject("");
    setIsCreatePairingOpen(true);
  }
  
  // Handle approving a pending pairing
  const handleApprovePairing = async (pairingId: string) => {
    try {
      setIsSubmitting(true);
      const result = await updatePairingStatus({
        pairingId,
        status: MatchStatus.ACCEPTED
      });
      
      if (result) {
        // Refresh the pairings list
        const updatedPairings = await getAllPairings();
        setPairings(updatedPairings);
        
        toast.success("Pairing approved successfully");
        
        // Close the details dialog
        setIsDetailsOpen(false);
      }
    } catch (error) {
      console.error("Error approving pairing:", error);
      toast.error("Failed to approve pairing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // Handle rejecting a pending pairing
  const handleRejectPairing = async (pairingId: string, reason: string) => {
    try {
      setIsSubmitting(true);
      const result = await updatePairingStatus({
        pairingId,
        status: MatchStatus.REJECTED,
        reason
      });
      
      if (result) {
        // Refresh the pairings list
        const updatedPairings = await getAllPairings();
        setPairings(updatedPairings);
        
        toast.success("Pairing rejected successfully");
        
        // Close the dialogs
        setIsRejectDialogOpen(false);
        setIsDetailsOpen(false);
      }
    } catch (error) {
      console.error("Error rejecting pairing:", error);
      toast.error("Failed to reject pairing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // Handle resolving an issue with a pairing
  const handleResolvePairing = async (pairingId: string) => {
    try {
      setIsSubmitting(true);
      const result = await updatePairingStatus({
        pairingId,
        status: MatchStatus.ONGOING
      });
      
      if (result) {
        // Refresh the pairings list
        const updatedPairings = await getAllPairings();
        setPairings(updatedPairings);
        
        toast.success("Issue resolved successfully");
        
        // Close the details dialog
        setIsDetailsOpen(false);
      }
    } catch (error) {
      console.error("Error resolving issue:", error);
      toast.error("Failed to resolve issue. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // Handle dissolving a pairing (deleting it)
  const handleDissolvePairing = async (pairingId: string) => {
    try {
      setIsSubmitting(true);
      const result = await deletePairing(pairingId);
      
      if (result) {
        // Refresh the pairings list
        const updatedPairings = await getAllPairings();
        setPairings(updatedPairings);
        
        toast.success("Pairing dissolved successfully");
        
        // Close the details dialog
        setIsDetailsOpen(false);
      }
    } catch (error) {
      console.error("Error dissolving pairing:", error);
      toast.error("Failed to dissolve pairing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const handleCreatePairing = async () => {
    if (!selectedTutor || !selectedStudent || !newPairingSubject) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create a new pairing object
      const newPairing: NewMatch = {
        studentId: selectedStudent._id,
        tutorId: selectedTutor._id,
        status: MatchStatus.PENDING,
        subject: newPairingSubject.toLowerCase()
      };
      
      // Call the server action to create the pairing
      const result = await createPairing(newPairing);
      
      if (result) {
        // Refresh the pairings list
        const updatedPairings = await getAllPairings();
        setPairings(updatedPairings);
        
        toast.success("Pairing created successfully");
        
        // Close the dialog
        setIsCreatePairingOpen(false);
      }
    } catch (error) {
      console.error("Error creating pairing:", error);
      toast.error("Failed to create pairing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <DashboardLayout title="Tutor - Student Matching Management">
      <div>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <CardTitle className="text-2xl">Pairing Table</CardTitle>
              <Button onClick={handleOpenCreatePairing} disabled={isLoading}>
                <SquarePlus className="h-5 w-5" />
                Create Pairing
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student, tutor, or subject..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter} disabled={isLoading}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.values(MatchStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading pairings...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                <p>{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => {
                    setIsLoading(true);
                    setError(null);
                    getAllPairings()
                      .then(data => {
                        setPairings(data);
                        setIsLoading(false);
                      })
                      .catch(err => {
                        console.error(err);
                        setError('Failed to load pairings. Please try again.');
                        setIsLoading(false);
                      });
                  }}
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPairings.length > 0 ? (
                  filteredPairings.map(pairing => (
                    <div key={pairing.id} className="flex flex-wrap justify-between items-center border-b pb-4">
                      <div className="mb-2 sm:mb-0">
                        <div className="font-medium">{pairing.student.name} & {pairing.tutor.name}</div>
                        <div className="text-sm text-muted-foreground">Subject: {pairing.subject.charAt(0).toUpperCase() + pairing.subject.slice(1).toLowerCase()}</div>
                        {pairing.reason && (
                          <div className="text-xs text-muted-foreground">
                            Reason: {pairing.reason}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2 items-center">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${pairing.status === MatchStatus.PENDING ? "bg-yellow-100 text-yellow-800" :
                          pairing.status === MatchStatus.ONGOING ? "bg-green-100 text-green-800" :
                            pairing.status === MatchStatus.ACCEPTED ? "bg-blue-100 text-blue-800" :
                              pairing.status === MatchStatus.COMPLETED ? "bg-purple-100 text-purple-800" :
                                "bg-red-100 text-red-800"
                          }`}>
                          {pairing.status.charAt(0).toUpperCase() + pairing.status.slice(1).toLowerCase()}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleOpenDetails(pairing)}>
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No pairings found matching your filters.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>


      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Pairing Details</DialogTitle>
            <DialogDescription>
              Complete information about this student-tutor pairing.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPairing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-sm">Student</h3>
                  <p>{selectedPairing.student.name}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm">Tutor</h3>
                  <p>{selectedPairing.tutor.name}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-sm">Subject</h3>
                <p>{selectedPairing.subject.charAt(0).toUpperCase() + selectedPairing.subject.slice(1).toLowerCase()}</p>
              </div>
              
              <div>
                <h3 className="font-medium text-sm">Status</h3>
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isPendingPairing(selectedPairing) ? "bg-yellow-100 text-yellow-800" :
                  isActivePairing(selectedPairing) ? "bg-green-100 text-green-800" :
                  isCompletedPairing(selectedPairing) ? "bg-purple-100 text-purple-800" :
                  "bg-red-100 text-red-800"
                }`}>
                  {selectedPairing.status.charAt(0).toUpperCase() + selectedPairing.status.slice(1).toLowerCase()}
                </div>
              </div>
              
              {/* {isPendingPairing(selectedPairing) && (
                <div>
                  <h3 className="font-medium text-sm">Request Date</h3>
                  <p>{selectedPairing.requestDate}</p>
                </div>
              )}
              
              {(isActivePairing(selectedPairing) || isIssuePairing(selectedPairing)) && (
                <div>
                  <h3 className="font-medium text-sm">Start Date</h3>
                  <p>{selectedPairing.startDate}</p>
                </div>
              )}
              
              {isActivePairing(selectedPairing) && (
                <>
                  <div>
                    <h3 className="font-medium text-sm">Last Session</h3>
                    <p>{selectedPairing.lastSession}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Next Session</h3>
                    <p>{selectedPairing.nextSession}</p>
                  </div>
                </>
              )} */}
              
              {isIssuePairing(selectedPairing) && (
                <>
                  {/* <div>
                    <h3 className="font-medium text-sm">Issue Date</h3>
                    <p>{selectedPairing.issueDate}</p>
                  </div> */}
                  <div>
                    <h3 className="font-medium text-sm">Issue Description</h3>
                    <p className="text-red-600">{selectedPairing.reason}</p>
                  </div>
                </>
              )}
            </div>
          )}
          
          <DialogFooter className="gap-2">
            {selectedPairing && isPendingPairing(selectedPairing) && (
              <>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    setIsRejectDialogOpen(true);
                    setIsDetailsOpen(false);
                  }}
                  disabled={isSubmitting}
                >
                  Reject
                </Button>
                <Button 
                  onClick={() => handleApprovePairing(selectedPairing.id)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Approve'
                  )}
                </Button>
              </>
            )}
            
            {selectedPairing && isActivePairing(selectedPairing) && (
              <>
                <Button variant="outline" disabled={isSubmitting}>Message Both</Button>
                <Button variant="destructive" disabled={isSubmitting}>Report Issue</Button>
                <Button disabled={isSubmitting}>View Sessions</Button>
              </>
            )}
            
            {selectedPairing && isIssuePairing(selectedPairing) && (
              <>
                <Button 
                  variant="destructive" 
                  onClick={() => handleDissolvePairing(selectedPairing.id)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Dissolve Pairing'
                  )}
                </Button>
                <Button 
                  onClick={() => handleResolvePairing(selectedPairing.id)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Resolve Issue'
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreatePairingOpen} onOpenChange={setIsCreatePairingOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Pairing</DialogTitle>
            <DialogDescription>
              Create a new student-tutor pairing.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <UserSelectionModal 
              onSelectTutor={(tutor) => setSelectedTutor(tutor)}
              onSelectStudent={(student) => setSelectedStudent(student)}
              selectedTutor={selectedTutor}
              selectedStudent={selectedStudent}
            />
            
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Subject</label>
              <Input 
                placeholder="Enter subject..." 
                value={newPairingSubject}
                onChange={(e) => setNewPairingSubject(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
            
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCreatePairingOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreatePairing}
              disabled={!selectedTutor || !selectedStudent || !newPairingSubject || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Pairing'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reject Pairing</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this pairing.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <label className="block text-sm font-medium mb-1">Reason</label>
            <Input 
              placeholder="Enter reason for rejection..." 
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
            
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectReason("");
                if (selectedPairing) {
                  setIsDetailsOpen(true);
                }
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (selectedPairing && rejectReason) {
                  handleRejectPairing(selectedPairing.id, rejectReason);
                }
              }}
              disabled={!rejectReason || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Reject Pairing'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>

  )
};

export default Page;