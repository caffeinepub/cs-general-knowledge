import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import OutCall "http-outcalls/outcall";

actor {
  type MessageRole = {
    #user;
    #assistant;
  };

  type Message = {
    id : Nat;
    role : MessageRole;
    content : Text;
    timestamp : Time.Time;
    language : Text;
  };

  type Category = {
    #science;
    #geography;
    #technology;
    #arts;
    #history;
    #sports;
    #politics;
    #general;
  };

  type Language = {
    id : Nat;
    name : Text;
    code : Text;
  };

  module Category {
    public func toText(category : Category) : Text {
      switch (category) {
        case (#science) { "science" };
        case (#geography) { "geography" };
        case (#technology) { "technology" };
        case (#arts) { "arts" };
        case (#history) { "history" };
        case (#sports) { "sports" };
        case (#politics) { "politics" };
        case (#general) { "general" };
      };
    };
  };

  module Message {
    public func compare(msg1 : Message, msg2 : Message) : Order.Order {
      Nat.compare(msg1.id, msg2.id);
    };
  };

  var nextMessageId = 0;

  let messages = Map.empty<Principal, [Message]>();

  let supportedLanguages = [
    { id = 1; name = "English"; code = "en" },
    { id = 2; name = "Hindi"; code = "hi" },
    { id = 3; name = "Bengali"; code = "bn" },
    { id = 4; name = "Marathi"; code = "mr" },
    { id = 5; name = "Telugu"; code = "te" },
    { id = 6; name = "Punjabi"; code = "pa" },
    { id = 7; name = "Gujarati"; code = "gu" },
    { id = 8; name = "Tamil"; code = "ta" },
    { id = 9; name = "Urdu"; code = "ur" },
    { id = 10; name = "Kannada"; code = "kn" },
    { id = 11; name = "Spanish"; code = "es" },
    { id = 12; name = "French"; code = "fr" },
    { id = 13; name = "German"; code = "de" },
    { id = 14; name = "Italian"; code = "it" },
    { id = 15; name = "Portuguese"; code = "pt" },
    { id = 16; name = "Russian"; code = "ru" },
    { id = 17; name = "Chinese"; code = "zh" },
    { id = 18; name = "Japanese"; code = "ja" },
    { id = 19; name = "Korean"; code = "ko" },
    { id = 20; name = "Arabic"; code = "ar" },
  ];

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  func validateLanguage(language : Text) {
    if (not supportedLanguages.any(func(lang) { lang.name == language })) {
      Runtime.trap("Invalid language. Language: " # language # " is not supported. ");
    };
  };

  public shared ({ caller }) func askQuestion(question : Text, language : Text) : async Text {
    validateLanguage(language);
    let apiResponse = await OutCall.httpGetRequest(
      "https://api.cs-assistant.com/gk?question=" # question # "&lang=" # language,
      [],
      transform,
    );
    let message : Message = {
      id = nextMessageId;
      role = #user;
      content = question;
      timestamp = Time.now();
      language;
    };
    nextMessageId += 1;
    switch (messages.get(caller)) {
      case (null) {
        messages.add(caller, [message]);
      };
      case (?existingMessages) {
        messages.add(caller, existingMessages.concat([message]));
      };
    };
    apiResponse;
  };

  public query ({ caller }) func getChatHistory() : async [Message] {
    switch (messages.get(caller)) {
      case (null) { [] };
      case (?userMessages) {
        userMessages.sort();
      };
    };
  };

  public query ({ caller }) func getMessagesByLanguage() : async [Message] {
    switch (messages.get(caller)) {
      case (null) { [] };
      case (?userMessages) {
        userMessages.sort();
      };
    };
  };

  public shared ({ caller }) func clearHistory() : async () {
    messages.remove(caller);
  };

  public query ({ caller }) func getSupportedLanguages() : async [Text] {
    supportedLanguages.map(func(lang) { lang.name });
  };

  public query ({ caller }) func getSupportedLanguageCodes() : async [Text] {
    supportedLanguages.map(func(lang) { lang.code });
  };

  public query ({ caller }) func getCategories() : async [Text] {
    [
      Category.toText(#science),
      Category.toText(#geography),
      Category.toText(#technology),
      Category.toText(#arts),
      Category.toText(#history),
      Category.toText(#sports),
      Category.toText(#politics),
      Category.toText(#general),
    ];
  };
};
