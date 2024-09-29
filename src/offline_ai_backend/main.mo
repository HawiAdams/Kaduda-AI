import Array "mo:base/Array"; // Import the Array module

actor {
  stable var messageLog : [Text] = [];

  // Function to store the received message
  public func addMessage(msg: Text) : async Text {
    messageLog := Array.append(messageLog, [msg]);
    return "Message added: " # msg;
  };

  // Function to retrieve the stored messages
  public query func getMessages() : async [Text] {
    return messageLog;
  };
};
