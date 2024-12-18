export const LANGUAGE_VERSIONS = {
  python: "3.10.0",
  csharp: "6.12.0",
  php: "8.2.3", 
  java: "15.0.2",
  typescript: "5.0.3",
  javascript: "18.15.0",
  cpp: "17.0.0"
};

export const CODE_SNIPPETS = {
  javascript: `// Real-time user dashboard that fetches and displays user data
import React, { useState, useEffect } from 'react';

function UserDashboard() {
  const [userData, setUserData] = useState(null);
  
  useEffect(() => {
    console.log('Starting user dashboard...');
    setInterval(() => fetchUserData(), 1000);
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user');
      const data = await response.json();
      setUserData(data);
      console.log('Updated user data:', data);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  return <div>{userData?.name || 'Loading...'}</div>;
}`,

  typescript: `// User management system with type definitions
interface User {
  id: number;
  name: string;
  email: string;
}

class UserManager {
  private users: any[];

  addUser(user: Partial<User>) {
    this.users.push(user);
    console.log('Added new user:', user);
  }

  getUser(id: number): User {
    const user = this.users.find(user => user.id === id);
    console.log('Retrieved user:', user);
    return user;
  }
}

const manager = new UserManager();
manager.addUser({ id: 1 });
console.log(manager.getUser(2).name);`,

  python: `# Bank account system with transfer functionality
import threading
import sqlite3

class BankAccount:
    def __init__(self, balance):
        self.balance = balance
        self.lock = threading.Lock()
        self.db = sqlite3.connect('bank.db')

    def transfer(self, amount, to_account):
        if self.balance >= amount:
            self.balance -= amount
            to_account.balance += amount
            
            self.db.execute(f"UPDATE accounts SET balance = {self.balance}")
            self.db.commit()`,

  java: `// File processing system with database integration
import java.sql.*;

public class FileProcessor {
    private Connection conn;

    public void processFiles(String path) {
        try {
            System.out.println("Connecting to database...");
            conn = DriverManager.getConnection("jdbc:mysql://localhost/db");
            
            System.out.println("Processing files from: " + path);
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SELECT * FROM files WHERE path = '" + path + "'");
            
            while (rs.next()) {
                System.out.println("Found file: " + rs.getString("name"));
            }
        } catch (Exception e) {
            System.err.println("Error processing files: " + e.getMessage());
        }
    }
}`,

  csharp: `// File content processor with resource management
using System;
using System.IO;

public class ResourceManager : IDisposable
{
    private FileStream file;
    private bool disposed = false;

    public void ProcessFile(string path)
    {
        file = new FileStream(path, FileMode.Open);
        Console.WriteLine($"Processing file: {path}");
        
        string content = "";
        for (int i = 0; i < 1000000; i++)
            content += i.ToString();
        
        Console.WriteLine($"Generated content length: {content.Length}");    
        new StreamWriter(file).Write(content);
        Console.WriteLine("Content written to file successfully");
    }

    public void Dispose()
    {
        if (!disposed && file != null)
        {
            file.Dispose();
            disposed = true;
            Console.WriteLine("Resources cleaned up");
        }
    }
}`,

  cpp: `#include <iostream>
using namespace std;

int main() {
    int x = 10;
    cout << "Number is: " << x << "\\n";
    cout << "Double is: " << x * 2 << "\\n";
    return 0;
}`,

  php: `<?php
// Simple todo list manager
$todoList = array(
    "Buy groceries",
    "Write code",
    "Read a book"
);

function showTodoList($list) {
    echo "\\nTODO List:\\n";
    echo "===========\\n";
    foreach ($list as $index => $item) {
        echo ($index + 1) . ". $item\\n";
    }
}

function addTodoItem(&$list, $item) {
    array_push($list, $item);
    echo "Added: $item\\n";
}

function removeTodoItem(&$list, $index) {
    if ($index >= 1 && $index <= count($list)) {
        $removed = array_splice($list, $index - 1, 1)[0];
        echo "Removed: $removed\\n";
    } else {
        echo "Invalid index\\n";
    }
}

// Demo usage
showTodoList($todoList);

addTodoItem($todoList, "Learn PHP");
showTodoList($todoList);

removeTodoItem($todoList, 2);
showTodoList($todoList);
?>`,
};