package com.project.warehouse_management_system.WareHouse.service;

import com.project.warehouse_management_system.BaseClasses.BaseService;
import com.project.warehouse_management_system.WareHouse.model.Row;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class RowService extends BaseService<Row,Long> {
    @Override
    protected void setEntityId(Row entity, Long id) {
        entity.setId(id);
    }
}
