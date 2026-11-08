ALTER TABLE service_requirement
    ADD COLUMN resolution_policy VARCHAR(40) NOT NULL DEFAULT 'REQUIRED',
    ADD CONSTRAINT chk_service_requirement_resolution
        CHECK (resolution_policy IN ('REQUIRED', 'NOT_APPLICABLE_ALLOWED')),
    ADD CONSTRAINT uq_service_requirement_service_id UNIQUE (service_id, id);

CREATE TABLE service_requirement_source (
    service_requirement_id BIGINT NOT NULL,
    source_id BIGINT NOT NULL,
    PRIMARY KEY (service_requirement_id, source_id),
    CONSTRAINT fk_service_requirement_source_requirement
        FOREIGN KEY (service_requirement_id) REFERENCES service_requirement (id) ON DELETE RESTRICT,
    CONSTRAINT fk_service_requirement_source_source
        FOREIGN KEY (source_id) REFERENCES official_source (id) ON DELETE RESTRICT
) ENGINE = InnoDB;

CREATE TABLE requirement_condition_value (
    id BIGINT NOT NULL AUTO_INCREMENT,
    requirement_node_id BIGINT NOT NULL,
    value_order INT NOT NULL,
    value_type VARCHAR(20) NOT NULL,
    value_text VARCHAR(500) NULL,
    value_boolean BOOLEAN NULL,
    value_number DECIMAL(20, 6) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uq_requirement_condition_value_order UNIQUE (requirement_node_id, value_order),
    CONSTRAINT fk_requirement_condition_value_node
        FOREIGN KEY (requirement_node_id) REFERENCES requirement_node (id) ON DELETE RESTRICT,
    CONSTRAINT chk_requirement_condition_value_type
        CHECK (value_type IN ('STRING', 'BOOLEAN', 'NUMBER')),
    CONSTRAINT chk_requirement_condition_value_shape
        CHECK ((value_text IS NOT NULL) + (value_boolean IS NOT NULL) + (value_number IS NOT NULL) = 1),
    CONSTRAINT chk_requirement_condition_value_order CHECK (value_order >= 0)
) ENGINE = InnoDB;

ALTER TABLE requirement_node
    ADD CONSTRAINT chk_requirement_node_value_shape
        CHECK ((value_text IS NOT NULL) + (value_boolean IS NOT NULL) + (value_number IS NOT NULL) <= 1),
    ADD CONSTRAINT chk_requirement_node_in_set_shape
        CHECK (operator_name <> 'IN_SET' OR (value_text IS NULL AND value_boolean IS NULL AND value_number IS NULL));

ALTER TABLE document_dependency
    ADD COLUMN condition_node_id BIGINT NULL,
    DROP FOREIGN KEY fk_dependency_source_requirement;

ALTER TABLE document_dependency
    ADD CONSTRAINT fk_dependency_source_requirement_service
        FOREIGN KEY (service_id, source_requirement_id) REFERENCES service_requirement (service_id, id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_dependency_condition_node
        FOREIGN KEY (condition_node_id) REFERENCES requirement_node (id) ON DELETE RESTRICT,
    DROP CHECK chk_dependency_target,
    ADD CONSTRAINT chk_dependency_exactly_one_target
        CHECK ((prerequisite_document_type_id IS NOT NULL) <> (prerequisite_service_id IS NOT NULL)),
    ADD CONSTRAINT chk_dependency_condition_required
        CHECK (dependency_kind <> 'CONDITIONAL' OR condition_node_id IS NOT NULL);

ALTER TABLE service_localization
    DROP FOREIGN KEY fk_service_localization_service;

ALTER TABLE service_localization
    ADD CONSTRAINT fk_service_localization_service
        FOREIGN KEY (service_id) REFERENCES government_service (id) ON DELETE RESTRICT;

ALTER TABLE service_source
    DROP FOREIGN KEY fk_service_source_service,
    DROP FOREIGN KEY fk_service_source_source;

ALTER TABLE service_source
    ADD CONSTRAINT fk_service_source_service
        FOREIGN KEY (service_id) REFERENCES government_service (id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_service_source_source
        FOREIGN KEY (source_id) REFERENCES official_source (id) ON DELETE RESTRICT;

ALTER TABLE service_link
    DROP FOREIGN KEY fk_service_link_service,
    DROP FOREIGN KEY fk_service_link_source;

ALTER TABLE service_link
    ADD CONSTRAINT fk_service_link_service
        FOREIGN KEY (service_id) REFERENCES government_service (id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_service_link_source
        FOREIGN KEY (source_id) REFERENCES official_source (id) ON DELETE RESTRICT;

ALTER TABLE service_requirement
    DROP FOREIGN KEY fk_service_requirement_service;

ALTER TABLE service_requirement
    ADD CONSTRAINT fk_service_requirement_service
        FOREIGN KEY (service_id) REFERENCES government_service (id) ON DELETE RESTRICT;

ALTER TABLE requirement_node
    DROP FOREIGN KEY fk_requirement_node_requirement,
    DROP FOREIGN KEY fk_requirement_node_parent;

ALTER TABLE requirement_node
    ADD CONSTRAINT fk_requirement_node_requirement
        FOREIGN KEY (service_requirement_id) REFERENCES service_requirement (id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_requirement_node_parent
        FOREIGN KEY (parent_node_id) REFERENCES requirement_node (id) ON DELETE RESTRICT;

ALTER TABLE requirement_source
    DROP FOREIGN KEY fk_requirement_source_node,
    DROP FOREIGN KEY fk_requirement_source_source;

ALTER TABLE requirement_source
    ADD CONSTRAINT fk_requirement_source_node
        FOREIGN KEY (requirement_node_id) REFERENCES requirement_node (id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_requirement_source_source
        FOREIGN KEY (source_id) REFERENCES official_source (id) ON DELETE RESTRICT;

ALTER TABLE accepted_alternative_group
    DROP FOREIGN KEY fk_alternative_group_requirement;

ALTER TABLE accepted_alternative_group
    ADD CONSTRAINT fk_alternative_group_requirement
        FOREIGN KEY (service_requirement_id) REFERENCES service_requirement (id) ON DELETE RESTRICT;

ALTER TABLE alternative_document
    DROP FOREIGN KEY fk_alternative_document_group,
    DROP FOREIGN KEY fk_alternative_document_type;

ALTER TABLE alternative_document
    ADD CONSTRAINT fk_alternative_document_group
        FOREIGN KEY (alternative_group_id) REFERENCES accepted_alternative_group (id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_alternative_document_type
        FOREIGN KEY (document_type_id) REFERENCES document_type (id) ON DELETE RESTRICT;

ALTER TABLE document_dependency
    DROP FOREIGN KEY fk_dependency_service,
    DROP FOREIGN KEY fk_dependency_document,
    DROP FOREIGN KEY fk_dependency_service_prerequisite;

ALTER TABLE document_dependency
    ADD CONSTRAINT fk_dependency_service
        FOREIGN KEY (service_id) REFERENCES government_service (id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_dependency_document
        FOREIGN KEY (prerequisite_document_type_id) REFERENCES document_type (id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_dependency_service_prerequisite
        FOREIGN KEY (prerequisite_service_id) REFERENCES government_service (id) ON DELETE RESTRICT;

ALTER TABLE fee_information
    DROP FOREIGN KEY fk_fee_information_service;

ALTER TABLE fee_information
    ADD CONSTRAINT fk_fee_information_service
        FOREIGN KEY (service_id) REFERENCES government_service (id) ON DELETE RESTRICT;

ALTER TABLE fee_source
    DROP FOREIGN KEY fk_fee_source_fee,
    DROP FOREIGN KEY fk_fee_source_source;

ALTER TABLE fee_source
    ADD CONSTRAINT fk_fee_source_fee
        FOREIGN KEY (fee_information_id) REFERENCES fee_information (id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_fee_source_source
        FOREIGN KEY (source_id) REFERENCES official_source (id) ON DELETE RESTRICT;

ALTER TABLE processing_time_information
    DROP FOREIGN KEY fk_processing_time_service;

ALTER TABLE processing_time_information
    ADD CONSTRAINT fk_processing_time_service
        FOREIGN KEY (service_id) REFERENCES government_service (id) ON DELETE RESTRICT;

ALTER TABLE processing_time_source
    DROP FOREIGN KEY fk_processing_time_source_time,
    DROP FOREIGN KEY fk_processing_time_source_source;

ALTER TABLE processing_time_source
    ADD CONSTRAINT fk_processing_time_source_time
        FOREIGN KEY (processing_time_information_id) REFERENCES processing_time_information (id) ON DELETE RESTRICT,
    ADD CONSTRAINT fk_processing_time_source_source
        FOREIGN KEY (source_id) REFERENCES official_source (id) ON DELETE RESTRICT;
