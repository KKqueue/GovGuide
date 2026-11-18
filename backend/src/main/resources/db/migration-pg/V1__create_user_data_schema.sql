CREATE TABLE app_user (
    user_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    encoded_password VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'USER',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_task (
    task_id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    service_code VARCHAR(100) NOT NULL,
    service_version INT NOT NULL,
    parent_task_id VARCHAR(36),
    root_task_id VARCHAR(36) NOT NULL,
    parent_requirement_code VARCHAR(120),
    dependency_code VARCHAR(120),
    depth INT NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL,
    context_json JSONB NOT NULL DEFAULT '{}',
    checklist_json JSONB NOT NULL DEFAULT '{}',
    child_tasks_json JSONB NOT NULL DEFAULT '{}',
    revision BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_task_child UNIQUE (parent_task_id, dependency_code),
    CONSTRAINT chk_task_depth CHECK (depth >= 0),
    CONSTRAINT chk_task_status CHECK (status IN ('PREPARING_DOCUMENTS', 'READY_TO_APPLY'))
);

CREATE INDEX idx_task_owner ON user_task (username, status);
CREATE INDEX idx_task_parent ON user_task (parent_task_id);
CREATE INDEX idx_task_root ON user_task (root_task_id);

CREATE TABLE tracking_record (
    application_id VARCHAR(36) PRIMARY KEY,
    task_id VARCHAR(36) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL,
    status VARCHAR(40) NOT NULL,
    submission_date DATE,
    appointment_date DATE,
    completion_date DATE,
    notes TEXT,
    tracking_link VARCHAR(2048),
    revision BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tracking_owner ON tracking_record (username, status);

CREATE TABLE feedback (
    id VARCHAR(36) PRIMARY KEY,
    service_code VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL,
    message TEXT NOT NULL,
    created_at BIGINT NOT NULL
);

CREATE INDEX idx_feedback_service ON feedback (service_code);

CREATE TABLE review (
    id VARCHAR(36) PRIMARY KEY,
    service_code VARCHAR(100) NOT NULL,
    task_id VARCHAR(36) NOT NULL,
    username VARCHAR(100) NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    message TEXT,
    created_at BIGINT NOT NULL,
    CONSTRAINT uq_review_task_user UNIQUE (task_id, username)
);

CREATE INDEX idx_review_service ON review (service_code);
