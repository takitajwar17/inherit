/**
 * Natural Language Parser Hook
 * 
 * Parses task input like "Study React tomorrow 2pm #study @high"
 * and extracts structured task data
 */

export function useNaturalLanguage() {
  const parseTaskInput = (input) => {
    if (!input || typeof input !== 'string') {
      return { title: '', category: 'other', priority: 'medium', dueDate: null };
    }

    const result = {
      title: input,
      category: 'other',
      priority: 'medium',
      dueDate: null,
      description: '',
    };

    // Extract category (#study, #assignment, etc.)
    const categoryMatch = input.match(/#(\w+)/);
    if (categoryMatch) {
      const cat = categoryMatch[1].toLowerCase();
      const validCategories = ['study', 'assignment', 'project', 'revision', 'exam', 'other'];
      if (validCategories.includes(cat)) {
        result.category = cat;
      }
      // Remove from title
      result.title = result.title.replace(/#\w+/g, '').trim();
    }

    // Extract priority (@high, @medium, @low or @p1, @p2, @p3)
    const priorityMatch = input.match(/@(high|medium|low|p1|p2|p3)/i);
    if (priorityMatch) {
      const pri = priorityMatch[1].toLowerCase();
      if (pri === 'p1' || pri === 'high') result.priority = 'high';
      else if (pri === 'p2' || pri === 'medium') result.priority = 'medium';
      else if (pri === 'p3' || pri === 'low') result.priority = 'low';
      // Remove from title
      result.title = result.title.replace(/@\w+/gi, '').trim();
    }

    // Extract date keywords
    const now = new Date();
    const lowerInput = input.toLowerCase();

    // Today
    if (lowerInput.includes('today')) {
      result.dueDate = new Date(now.setHours(23, 59, 59, 999));
      result.title = result.title.replace(/\btoday\b/gi, '').trim();
    }
    // Tomorrow
    else if (lowerInput.includes('tomorrow')) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);
      result.dueDate = tomorrow;
      result.title = result.title.replace(/\btomorrow\b/gi, '').trim();
    }
    // Next week
    else if (lowerInput.includes('next week')) {
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(23, 59, 59, 999);
      result.dueDate = nextWeek;
      result.title = result.title.replace(/\bnext week\b/gi, '').trim();
    }
    // This week
    else if (lowerInput.includes('this week')) {
      const thisWeek = new Date(now);
      const daysUntilSunday = 7 - thisWeek.getDay();
      thisWeek.setDate(thisWeek.getDate() + daysUntilSunday);
      thisWeek.setHours(23, 59, 59, 999);
      result.dueDate = thisWeek;
      result.title = result.title.replace(/\bthis week\b/gi, '').trim();
    }
    // Monday, Tuesday, etc.
    else {
      const dayMatch = lowerInput.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
      if (dayMatch) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const targetDay = days.indexOf(dayMatch[1].toLowerCase());
        const today = now.getDay();
        let daysToAdd = targetDay - today;
        if (daysToAdd <= 0) daysToAdd += 7; // Next occurrence
        
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() + daysToAdd);
        targetDate.setHours(23, 59, 59, 999);
        result.dueDate = targetDate;
        result.title = result.title.replace(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '').trim();
      }
    }

    // Extract time (2pm, 14:00, 2:30pm, etc.)
    const timeMatch = input.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
    if (timeMatch && result.dueDate) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const meridiem = timeMatch[3] ? timeMatch[3].toLowerCase() : null;

      if (meridiem === 'pm' && hours < 12) hours += 12;
      if (meridiem === 'am' && hours === 12) hours = 0;

      result.dueDate.setHours(hours, minutes, 0, 0);
      result.title = result.title.replace(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/gi, '').trim();
    }

    // Extract specific date formats (MM/DD, DD-MM, YYYY-MM-DD)
    const dateMatch = input.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/) || 
                      input.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
    if (dateMatch) {
      let year, month, day;
      
      if (dateMatch[0].includes('-')) {
        // YYYY-MM-DD
        year = parseInt(dateMatch[1]);
        month = parseInt(dateMatch[2]) - 1; // JS months are 0-indexed
        day = parseInt(dateMatch[3]);
      } else {
        // MM/DD or MM/DD/YYYY
        month = parseInt(dateMatch[1]) - 1;
        day = parseInt(dateMatch[2]);
        year = dateMatch[3] ? parseInt(dateMatch[3]) : now.getFullYear();
        if (year < 100) year += 2000; // Handle 2-digit years
      }
      
      const parsedDate = new Date(year, month, day, 23, 59, 59, 999);
      if (!isNaN(parsedDate.getTime())) {
        result.dueDate = parsedDate;
        result.title = result.title.replace(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/, '').trim();
        result.title = result.title.replace(/\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/, '').trim();
      }
    }

    // Clean up title - remove extra spaces
    result.title = result.title.replace(/\s+/g, ' ').trim();

    // If title is empty after parsing, use original input
    if (!result.title) {
      result.title = input.replace(/#\w+/g, '').replace(/@\w+/gi, '').trim();
    }

    return result;
  };

  const getSuggestions = (input) => {
    if (!input) return [];

    const suggestions = [];
    const lowerInput = input.toLowerCase();

    // Date suggestions
    if (lowerInput.includes('tod') || lowerInput.includes('tom') || lowerInput.includes('next')) {
      suggestions.push(
        { text: 'today', icon: '📅', type: 'date' },
        { text: 'tomorrow', icon: '📅', type: 'date' },
        { text: 'next week', icon: '📅', type: 'date' }
      );
    }

    // Category suggestions
    if (lowerInput.includes('#') || lowerInput.includes('study') || lowerInput.includes('assignment')) {
      suggestions.push(
        { text: '#study', icon: '📚', type: 'category' },
        { text: '#assignment', icon: '📝', type: 'category' },
        { text: '#project', icon: '💻', type: 'category' },
        { text: '#exam', icon: '📊', type: 'category' }
      );
    }

    // Priority suggestions
    if (lowerInput.includes('@') || lowerInput.includes('high') || lowerInput.includes('priority')) {
      suggestions.push(
        { text: '@high', icon: '🔴', type: 'priority' },
        { text: '@medium', icon: '🟡', type: 'priority' },
        { text: '@low', icon: '🔵', type: 'priority' }
      );
    }

    return suggestions.slice(0, 6);
  };

  return {
    parseTaskInput,
    getSuggestions,
  };
}

