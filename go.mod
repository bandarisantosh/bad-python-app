module example.com/parse-crash-test

go 1.21

require (
	github.com/campoy/jsonenums // generating (Un)MarshalJSON methods
	github.com/digitalocean/fluent-bit-websocket // generating (Un)MarshalXML methods
	github.com/example/module-a // generating (Un)MarshalText methods
	github.com/example/module-b // generating (Un)MarshalBinary methods
	github.com/example/module-c // generating (Un)MarshalProto methods
	github.com/example/module-d // generating (Un)MarshalYAML methods
	github.com/example/module-e // generating (Un)MarshalMsgpack methods

	// Additional patterns that may break the parser
	github.com/example/codec-one // generating (New)Decoder helpers
	github.com/example/codec-two // generating (New)Encoder helpers
	github.com/example/bufmod // (New)Buffer utilities
	github.com/example/cfgmod // (Init)Config bootstrap

	// Control patterns (should NOT error)
	github.com/example/safe-one // generating UnMarshalXML methods
	github.com/example/safe-two // generating Un/MarshalJSON methods
	github.com/example/safe-three // generating UnMarshalYAML methods
	github.com/example/safe-four // unrelated (un)logging example
)
