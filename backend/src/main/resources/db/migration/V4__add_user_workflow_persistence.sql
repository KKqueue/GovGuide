CREATE TABLE app_user (
    user_id BIGINT NOT NULL AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    CONSTRAINT uq_app_user_username UNIQUE (username)
) ENGINE = InnoDB;

CREATE TABLE user_service_task (
    task_id CHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    service_id BIGINT NOT NULL,
    service_code VARCHAR(100) NOT NULL,
    service_version INT NOT NULL,
    parent_task_id CHAR(36) NULL,
    root_task_id CHAR(36) NOT NULL,
    parent_requirement_id BIGINT NULL,
    parent_requirement_service_id BIGINT NULL,
    parent_requirement_code VARCHAR(120) NULL,
    dependency_code VARCHAR(120) NULL,
    depth INT NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL,
    context_json JSON NOT NULL,
    revision BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (task_id),
    CONSTRAINT uq_user_task_task_user UNIQUE (task_id, user_id),
    CONSTRAINT uq_user_task_task_service UNIQUE (task_id, service_id),
    CONSTRAINT uq_user_task_child_dependency UNIQUE (parent_task_id, dependency_code),
    CONSTRAINT fk_user_task_user FOREIGN KEY (user_id) REFERENCES app_user (user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_user_task_service FOREIGN KEY (service_id) REFERENCES government_service (id) ON DELETE RESTRICT,
    CONSTRAINT fk_user_task_parent FOREIGN KEY (parent_task_id) REFERENCES user_service_task (task_id) ON DELETE RESTRICT,
    CONSTRAINT fk_user_task_root FOREIGN KEY (root_task_id) REFERENCES user_service_task (task_id) ON DELETE RESTRICT,
    CONSTRAINT fk_user_task_parent_requirement_service FOREIGN KEY (parent_requirement_service_id, parent_requirement_id)
        REFERENCES service_requirement (service_id, id) ON DELETE RESTRICT,
    CONSTRAINT chk_user_task_depth CHECK (depth >= 0),
    CONSTRAINT chk_user_task_status CHECK (status IN ('PREPARING_DOCUMENTS', 'READY_TO_APPLY')),
    CONSTRAINT chk_user_task_child_fields CHECK ((parent_task_id IS NULL AND dependency_code IS NULL) OR (parent_task_id IS NOT NULL AND dependency_code IS NOT NULL))
) ENGINE = InnoDB;

CREATE INDEX idx_user_task_owner_status ON user_service_task (user_id, status);
CREATE INDEX idx_user_task_owner_service ON user_service_task (user_id, service_id);
CREATE INDEX idx_user_task_parent ON user_service_task (parent_task_id);
CREATE INDEX idx_user_task_root ON user_service_task (root_task_id);

CREATE TABLE user_checklist_item (
    checklist_item_id BIGINT NOT NULL AUTO_INCREMENT,
    task_id CHAR(36) NOT NULL,
    task_service_id BIGINT NOT NULL,
    service_requirement_id BIGINT NOT NULL,
    state VARCHAR(30) NOT NULL,
    resolution_note TEXT NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (checklist_item_id),
    CONSTRAINT uq_user_checklist_item UNIQUE (task_id, service_requirement_id),
    CONSTRAINT fk_user_checklist_task_service FOREIGN KEY (task_id, task_service_id)
        REFERENCES user_service_task (task_id, service_id) ON DELETE RESTRICT,
    CONSTRAINT fk_user_checklist_requirement_service FOREIGN KEY (task_service_id, service_requirement_id)
        REFERENCES service_requirement (service_id, id) ON DELETE RESTRICT,
    CONSTRAINT chk_user_checklist_state CHECK (state IN ('NOT_REVIEWED', 'NEEDS_VERIFICATION', 'MISSING', 'UPDATE_REQUIRED', 'COMPLETED'))
) ENGINE = InnoDB;

CREATE INDEX idx_user_checklist_task_state ON user_checklist_item (task_id, state);

CREATE TABLE application_tracking_record (
    application_id CHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    task_id CHAR(36) NOT NULL,
    status VARCHAR(40) NOT NULL,
    submission_date DATE NULL,
    appointment_date DATE NULL,
    completion_date DATE NULL,
    notes TEXT NULL,
    tracking_link VARCHAR(2048) NULL,
    tracking_link_provenance VARCHAR(40) NOT NULL DEFAULT 'USER_PROVIDED_UNVERIFIED',
    revision BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (application_id),
    CONSTRAINT uq_tracking_task UNIQUE (task_id),
    CONSTRAINT fk_tracking_user FOREIGN KEY (user_id) REFERENCES app_user (user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_tracking_task_user FOREIGN KEY (task_id, user_id)
        REFERENCES user_service_task (task_id, user_id) ON DELETE RESTRICT,
    CONSTRAINT chk_tracking_status CHECK (status IN ('PLANNING', 'PREPARING_DOCUMENTS', 'READY_TO_APPLY', 'SUBMITTED', 'APPOINTMENT_SCHEDULED', 'ADDITIONAL_INFORMATION_REQUIRED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DOCUMENT_ISSUED', 'COMPLETED')),
    CONSTRAINT chk_tracking_dates CHECK ((submission_date IS NULL OR appointment_date IS NULL OR appointment_date >= submission_date)
        AND (submission_date IS NULL OR completion_date IS NULL OR completion_date >= submission_date)
        AND (appointment_date IS NULL OR completion_date IS NULL OR completion_date >= appointment_date)),
    CONSTRAINT chk_tracking_link_provenance CHECK (tracking_link_provenance = 'USER_PROVIDED_UNVERIFIED')
) ENGINE = InnoDB;

CREATE INDEX idx_tracking_user_status ON application_tracking_record (user_id, status);
