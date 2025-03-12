// app/components/dev-discuss/QuestionCard.jsx

"use client";
import { useAuth } from "@clerk/nextjs"; // Adjust based on your auth provider


export default function QuestionCard({ question }) {
  const { userId } = useAuth();
  const [votes, setVotes] = useState(question.votes);
  const [userVote, setUserVote] = useState(0); // 1 for upvoted, -1 for downvoted, 0 for none
 
   // app/components/dev-discuss/QuestionCard.jsx

   useEffect(() => {
    // Check if the user has already voted
    const existingVote = question.voters?.find(
      (voter) => voter.userId === userId
    );
    if (existingVote) {
      setUserVote(existingVote.vote);
    }
  }, [question.voters, userId]);

  const handleUpvote = async () => {
    if (!userId) {
      toast.error("You must be logged in to vote");
      return;
    }
    try {
      const response = await fetch(`/api/questions/${question._id}/upvote`, {
        method: "POST",
      });
      const data = await response.json();
      if (response.ok) {
        setVotes((prevVotes) => prevVotes + 1);
        setUserVote(1);
      } else {
        toast.error(data.error || "Failed to upvote");
      }
    } catch (error) {
      console.error("Error upvoting:", error);
      toast.error("Error upvoting. Please try again.");
    }

    const handleDownvote = async () => {
      if (!userId) {
        toast.error("You must be logged in to vote");
        return;
      }
      try {
        const response = await fetch(`/api/questions/${question._id}/downvote`, {
          method: "POST",
        });
        const data = await response.json();
        if (response.ok) {
          setVotes((prevVotes) => prevVotes - 1);
          setUserVote(-1);
        } else {
          toast.error(data.error || "Failed to downvote");
        }
      } catch (error) {
        console.error("Error downvoting:", error);
        toast.error("Error downvoting. Please try again.");
      }
    };
  
  };

  return (
     <div><h1>{userId}</h1></div>
  );
}
