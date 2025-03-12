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


  return (
     <div><h1>{userId}</h1></div>
  );
}
