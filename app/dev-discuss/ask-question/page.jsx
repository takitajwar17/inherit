// app/dev-discuss/ask-question/page.jsx

// "use client";


export default function AskQuestionPage() {
  
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
 
 
  const handleTagInputKeyDown = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
        setTagInput("");
      }
    } else if (e.key === "Backspace" && !tagInput) {
      e.preventDefault();
      setTags(tags.slice(0, -1));
    }
  };
  return (
    <main className="min-h-screen bg-background">
      
    </main>
  );
}
