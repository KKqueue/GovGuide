CREATE TABLE government_service (
    id BIGINT NOT NULL AUTO_INCREMENT,
    service_code VARCHAR(100) NOT NULL,
    version_number INT NOT NULL,
    status VARCHAR(30) NOT NULL,
    publication_readiness VARCHAR(40) NOT NULL,
    authority VARCHAR(255) NOT NULL,
    jurisdiction VARCHAR(40) NOT NULL,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_government_service_version UNIQUE (service_code, version_number),
    CONSTRAINT chk_government_service_status CHECK (status IN ('DRAFT', 'REVIEW', 'PUBLISHED', 'SUPERSEDED', 'WITHDRAWN')),
    CONSTRAINT chk_government_service_readiness CHECK (publication_readiness IN ('UNREVIEWED', 'LIMITED_ROUTE_CANDIDATE', 'READY_FOR_REVIEW', 'APPROVED', 'NOT_PUBLISHABLE'))
) ENGINE = InnoDB;

CREATE TABLE service_localization (
    id BIGINT NOT NULL AUTO_INCREMENT,
    service_id BIGINT NOT NULL,
    locale_code VARCHAR(10) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    eligibility_summary TEXT NULL,
    procedure_summary TEXT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_service_localization UNIQUE (service_id, locale_code),
    CONSTRAINT fk_service_localization_service FOREIGN KEY (service_id) REFERENCES government_service (id)
) ENGINE = InnoDB;

CREATE TABLE document_type (
    id BIGINT NOT NULL AUTO_INCREMENT,
    document_code VARCHAR(100) NOT NULL,
    issuing_authority VARCHAR(255) NULL,
    status VARCHAR(30) NOT NULL,
    verification_status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT uq_document_type_code UNIQUE (document_code),
    CONSTRAINT chk_document_type_status CHECK (status IN ('DRAFT', 'ACTIVE', 'SUPERSEDED', 'WITHDRAWN')),
    CONSTRAINT chk_document_type_verification CHECK (verification_status IN ('CURRENT', 'NEEDS_REVIEW', 'SUPERSEDED', 'UNVERIFIED'))
) ENGINE = InnoDB;

CREATE TABLE official_source (
    id BIGINT NOT NULL AUTO_INCREMENT,
    source_code VARCHAR(120) NOT NULL,
    url VARCHAR(2048) NOT NULL,
    title VARCHAR(500) NOT NULL,
    publisher VARCHAR(255) NOT NULL,
    jurisdiction VARCHAR(40) NOT NULL,
    publication_date DATE NULL,
    last_updated_date DATE NULL,
    checked_at TIMESTAMP NOT NULL,
    access_status VARCHAR(30) NOT NULL,
    verification_status VARCHAR(30) NOT NULL,
    evidence_notes TEXT NULL,
    uncertainty TEXT NULL,
    reviewer VARCHAR(255) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_official_source_code UNIQUE (source_code),
    CONSTRAINT chk_source_access_status CHECK (access_status IN ('ACCESSIBLE', 'UNAVAILABLE', 'NOT_FOUND', 'HTTP_ERROR')),
    CONSTRAINT chk_source_verification_status CHECK (verification_status IN ('CURRENT', 'NEEDS_REVIEW', 'SUPERSEDED', 'UNVERIFIED'))
) ENGINE = InnoDB;

CREATE TABLE service_source (
    service_id BIGINT NOT NULL,
    source_id BIGINT NOT NULL,
    relationship_type VARCHAR(40) NOT NULL,
    claim TEXT NOT NULL,
    PRIMARY KEY (service_id, source_id, relationship_type),
    CONSTRAINT fk_service_source_service FOREIGN KEY (service_id) REFERENCES government_service (id),
    CONSTRAINT fk_service_source_source FOREIGN KEY (source_id) REFERENCES official_source (id)
) ENGINE = InnoDB;

CREATE TABLE service_link (
    id BIGINT NOT NULL AUTO_INCREMENT,
    service_id BIGINT NOT NULL,
    source_id BIGINT NULL,
    link_type VARCHAR(40) NOT NULL,
    url VARCHAR(2048) NOT NULL,
    status VARCHAR(30) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_service_link UNIQUE (service_id, link_type, url(700)),
    CONSTRAINT fk_service_link_service FOREIGN KEY (service_id) REFERENCES government_service (id),
    CONSTRAINT fk_service_link_source FOREIGN KEY (source_id) REFERENCES official_source (id),
    CONSTRAINT chk_service_link_status CHECK (status IN ('CURRENT', 'NEEDS_REVIEW', 'SUPERSEDED', 'UNVERIFIED'))
) ENGINE = InnoDB;

CREATE TABLE service_requirement (
    id BIGINT NOT NULL AUTO_INCREMENT,
    service_id BIGINT NOT NULL,
    requirement_code VARCHAR(120) NOT NULL,
    requirement_kind VARCHAR(30) NOT NULL,
    blocking BOOLEAN NOT NULL DEFAULT TRUE,
    evidence_status VARCHAR(30) NOT NULL,
    claim TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT uq_service_requirement_code UNIQUE (service_id, requirement_code),
    CONSTRAINT fk_service_requirement_service FOREIGN KEY (service_id) REFERENCES government_service (id),
    CONSTRAINT chk_service_requirement_kind CHECK (requirement_kind IN ('MANDATORY', 'CONDITIONAL', 'OPTIONAL', 'ALTERNATIVE_GROUP')),
    CONSTRAINT chk_service_requirement_evidence CHECK (evidence_status IN ('VERIFIED', 'UNVERIFIED', 'NEEDS_REVIEW'))
) ENGINE = InnoDB;

CREATE TABLE requirement_node (
    id BIGINT NOT NULL AUTO_INCREMENT,
    service_requirement_id BIGINT NOT NULL,
    parent_node_id BIGINT NULL,
    condition_code VARCHAR(120) NULL,
    node_type VARCHAR(30) NOT NULL,
    field_name VARCHAR(255) NULL,
    operator_name VARCHAR(40) NULL,
    value_text VARCHAR(500) NULL,
    value_boolean BOOLEAN NULL,
    value_number DECIMAL(20, 6) NULL,
    evidence_status VARCHAR(30) NOT NULL,
    claim TEXT NULL,
    display_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT uq_requirement_node_condition UNIQUE (service_requirement_id, condition_code),
    CONSTRAINT fk_requirement_node_requirement FOREIGN KEY (service_requirement_id) REFERENCES service_requirement (id),
    CONSTRAINT fk_requirement_node_parent FOREIGN KEY (parent_node_id) REFERENCES requirement_node (id),
    CONSTRAINT chk_requirement_node_type CHECK (node_type IN ('ALL', 'ANY', 'CONDITIONAL', 'ROUTE_SELECTION', 'PROCESS_STATE')),
    CONSTRAINT chk_requirement_node_operator CHECK (operator_name IS NULL OR operator_name IN ('EQUALS', 'NOT_EQUALS', 'LESS_THAN', 'GREATER_THAN', 'IN_SET')),
    CONSTRAINT chk_requirement_node_evidence CHECK (evidence_status IN ('VERIFIED', 'UNVERIFIED', 'NEEDS_REVIEW', 'INTERNAL_WORKFLOW'))
) ENGINE = InnoDB;

CREATE TABLE requirement_source (
    requirement_node_id BIGINT NOT NULL,
    source_id BIGINT NOT NULL,
    PRIMARY KEY (requirement_node_id, source_id),
    CONSTRAINT fk_requirement_source_node FOREIGN KEY (requirement_node_id) REFERENCES requirement_node (id),
    CONSTRAINT fk_requirement_source_source FOREIGN KEY (source_id) REFERENCES official_source (id)
) ENGINE = InnoDB;

CREATE TABLE accepted_alternative_group (
    id BIGINT NOT NULL AUTO_INCREMENT,
    service_requirement_id BIGINT NOT NULL,
    alternative_code VARCHAR(120) NOT NULL,
    minimum_required INT NOT NULL DEFAULT 1,
    evidence_status VARCHAR(30) NOT NULL,
    claim TEXT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_alternative_group_code UNIQUE (service_requirement_id, alternative_code),
    CONSTRAINT fk_alternative_group_requirement FOREIGN KEY (service_requirement_id) REFERENCES service_requirement (id),
    CONSTRAINT chk_alternative_group_minimum CHECK (minimum_required > 0),
    CONSTRAINT chk_alternative_group_evidence CHECK (evidence_status IN ('VERIFIED', 'UNVERIFIED', 'NEEDS_REVIEW'))
) ENGINE = InnoDB;

CREATE TABLE alternative_document (
    alternative_group_id BIGINT NOT NULL,
    document_type_id BIGINT NOT NULL,
    PRIMARY KEY (alternative_group_id, document_type_id),
    CONSTRAINT fk_alternative_document_group FOREIGN KEY (alternative_group_id) REFERENCES accepted_alternative_group (id),
    CONSTRAINT fk_alternative_document_type FOREIGN KEY (document_type_id) REFERENCES document_type (id)
) ENGINE = InnoDB;

CREATE TABLE document_dependency (
    id BIGINT NOT NULL AUTO_INCREMENT,
    dependency_code VARCHAR(120) NOT NULL,
    service_id BIGINT NOT NULL,
    source_requirement_id BIGINT NOT NULL,
    prerequisite_document_type_id BIGINT NULL,
    prerequisite_service_id BIGINT NULL,
    dependency_kind VARCHAR(30) NOT NULL,
    evidence_status VARCHAR(30) NOT NULL,
    claim TEXT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_document_dependency_code UNIQUE (service_id, dependency_code),
    CONSTRAINT fk_dependency_service FOREIGN KEY (service_id) REFERENCES government_service (id),
    CONSTRAINT fk_dependency_source_requirement FOREIGN KEY (source_requirement_id) REFERENCES service_requirement (id),
    CONSTRAINT fk_dependency_document FOREIGN KEY (prerequisite_document_type_id) REFERENCES document_type (id),
    CONSTRAINT fk_dependency_service_prerequisite FOREIGN KEY (prerequisite_service_id) REFERENCES government_service (id),
    CONSTRAINT chk_dependency_kind CHECK (dependency_kind IN ('REQUIRED', 'CONDITIONAL', 'OPTIONAL', 'ALTERNATIVE')),
    CONSTRAINT chk_dependency_evidence CHECK (evidence_status IN ('VERIFIED', 'UNVERIFIED', 'NEEDS_REVIEW')),
    CONSTRAINT chk_dependency_target CHECK (prerequisite_document_type_id IS NOT NULL OR prerequisite_service_id IS NOT NULL)
) ENGINE = InnoDB;

CREATE TABLE fee_information (
    id BIGINT NOT NULL AUTO_INCREMENT,
    service_id BIGINT NOT NULL,
    fee_code VARCHAR(120) NOT NULL,
    fee_category VARCHAR(30) NOT NULL,
    amount DECIMAL(12, 2) NULL,
    minimum_amount DECIMAL(12, 2) NULL,
    maximum_amount DECIMAL(12, 2) NULL,
    currency_code CHAR(3) NOT NULL DEFAULT 'INR',
    applicability TEXT NOT NULL,
    status VARCHAR(30) NOT NULL,
    claim TEXT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_fee_information_code UNIQUE (service_id, fee_code),
    CONSTRAINT fk_fee_information_service FOREIGN KEY (service_id) REFERENCES government_service (id),
    CONSTRAINT chk_fee_category CHECK (fee_category IN ('GOVERNMENT_FEE', 'SERVICE_CHARGE', 'DELIVERY_CHARGE', 'OTHER')),
    CONSTRAINT chk_fee_status CHECK (status IN ('VERIFIED', 'UNVERIFIED', 'NEEDS_REVIEW')),
    CONSTRAINT chk_fee_values CHECK ((amount IS NULL OR amount >= 0) AND (minimum_amount IS NULL OR minimum_amount >= 0) AND (maximum_amount IS NULL OR maximum_amount >= 0))
) ENGINE = InnoDB;

CREATE TABLE fee_source (
    fee_information_id BIGINT NOT NULL,
    source_id BIGINT NOT NULL,
    PRIMARY KEY (fee_information_id, source_id),
    CONSTRAINT fk_fee_source_fee FOREIGN KEY (fee_information_id) REFERENCES fee_information (id),
    CONSTRAINT fk_fee_source_source FOREIGN KEY (source_id) REFERENCES official_source (id)
) ENGINE = InnoDB;

CREATE TABLE processing_time_information (
    id BIGINT NOT NULL AUTO_INCREMENT,
    service_id BIGINT NOT NULL,
    timeline_code VARCHAR(120) NOT NULL,
    minimum_duration INT NULL,
    maximum_duration INT NULL,
    duration_unit VARCHAR(30) NULL,
    basis VARCHAR(40) NOT NULL,
    applicability TEXT NOT NULL,
    status VARCHAR(30) NOT NULL,
    claim TEXT NOT NULL,
    estimate_policy TEXT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_processing_time_code UNIQUE (service_id, timeline_code),
    CONSTRAINT fk_processing_time_service FOREIGN KEY (service_id) REFERENCES government_service (id),
    CONSTRAINT chk_processing_time_unit CHECK (duration_unit IS NULL OR duration_unit IN ('CALENDAR_DAYS', 'BUSINESS_DAYS', 'WEEKS', 'MONTHS')),
    CONSTRAINT chk_processing_time_basis CHECK (basis IN ('PUBLISHED_STANDARD', 'STATUTORY_LIMIT', 'OFFICIAL_SERVICE_DESCRIPTION', 'UNAVAILABLE')),
    CONSTRAINT chk_processing_time_status CHECK (status IN ('VERIFIED', 'QUALITATIVE_ONLY', 'UNAVAILABLE', 'NEEDS_REVIEW')),
    CONSTRAINT chk_processing_time_values CHECK ((minimum_duration IS NULL OR minimum_duration >= 0) AND (maximum_duration IS NULL OR maximum_duration >= 0) AND (minimum_duration IS NULL OR maximum_duration IS NULL OR minimum_duration <= maximum_duration))
) ENGINE = InnoDB;

CREATE TABLE processing_time_source (
    processing_time_information_id BIGINT NOT NULL,
    source_id BIGINT NOT NULL,
    PRIMARY KEY (processing_time_information_id, source_id),
    CONSTRAINT fk_processing_time_source_time FOREIGN KEY (processing_time_information_id) REFERENCES processing_time_information (id),
    CONSTRAINT fk_processing_time_source_source FOREIGN KEY (source_id) REFERENCES official_source (id)
) ENGINE = InnoDB;

CREATE INDEX idx_service_requirement_service ON service_requirement (service_id, display_order);
CREATE INDEX idx_requirement_node_parent ON requirement_node (parent_node_id);
CREATE INDEX idx_official_source_verification ON official_source (verification_status, checked_at);
CREATE INDEX idx_document_dependency_prerequisite_document ON document_dependency (prerequisite_document_type_id);
CREATE INDEX idx_document_dependency_prerequisite_service ON document_dependency (prerequisite_service_id);
