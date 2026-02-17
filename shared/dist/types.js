/**
 * Shared Types — Issue #42
 *
 * Core domain types used across API, MCP, and Web UI.
 */
// ============================================================================
// Enums
// ============================================================================
export var Status;
(function (Status) {
    Status["STARTED"] = "STARTED";
    Status["IN_PROGRESS"] = "IN_PROGRESS";
    Status["COMPLETED"] = "COMPLETED";
})(Status || (Status = {}));
export var Severity;
(function (Severity) {
    Severity["INFO"] = "INFO";
    Severity["MINOR"] = "MINOR";
    Severity["MAJOR"] = "MAJOR";
    Severity["URGENT"] = "URGENT";
})(Severity || (Severity = {}));
// Type aliases are defined near enums above
//# sourceMappingURL=types.js.map