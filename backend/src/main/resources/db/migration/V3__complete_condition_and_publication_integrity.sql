ALTER TABLE requirement_node
    ADD COLUMN service_id BIGINT NULL;

UPDATE requirement_node node
JOIN service_requirement requirement
    ON requirement.id = node.service_requirement_id
SET node.service_id = requirement.service_id
WHERE node.service_id IS NULL;

ALTER TABLE requirement_node
    MODIFY COLUMN service_id BIGINT NOT NULL,
    ADD CONSTRAINT uq_requirement_node_service_id UNIQUE (service_id, id),
    ADD CONSTRAINT fk_requirement_node_service_requirement
        FOREIGN KEY (service_id, service_requirement_id)
        REFERENCES service_requirement (service_id, id) ON DELETE RESTRICT;

ALTER TABLE document_dependency
    DROP FOREIGN KEY fk_dependency_condition_node,
    ADD CONSTRAINT fk_dependency_condition_node_service
        FOREIGN KEY (service_id, condition_node_id)
        REFERENCES requirement_node (service_id, id) ON DELETE RESTRICT;

ALTER TABLE requirement_condition_value
    DROP CHECK chk_requirement_condition_value_shape,
    ADD CONSTRAINT chk_requirement_condition_value_type_shape
        CHECK (
            (value_type = 'STRING' AND value_text IS NOT NULL AND value_boolean IS NULL AND value_number IS NULL)
            OR (value_type = 'BOOLEAN' AND value_text IS NULL AND value_boolean IS NOT NULL AND value_number IS NULL)
            OR (value_type = 'NUMBER' AND value_text IS NULL AND value_boolean IS NULL AND value_number IS NOT NULL)
        );

ALTER TABLE fee_information
    ADD CONSTRAINT chk_fee_range_order
        CHECK (minimum_amount IS NULL OR maximum_amount IS NULL OR minimum_amount <= maximum_amount);

ALTER TABLE processing_time_information
    ADD CONSTRAINT chk_processing_time_unit_required
        CHECK ((minimum_duration IS NULL AND maximum_duration IS NULL) OR duration_unit IS NOT NULL);
