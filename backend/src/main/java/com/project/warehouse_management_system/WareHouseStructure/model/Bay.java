package com.project.warehouse_management_system.WareHouseStructure.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Setter
@Getter
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "Bay")
public class Bay {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bay-name", nullable = false)
    private String bayName;

    @ManyToOne
    private Row row_sy;

    @CreatedDate
    @JsonIgnore
    @Column(name = "created_at",nullable = false,updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @JsonIgnore
    @Column(name = "last_modified",insertable = false)
    private LocalDateTime lastModified;
}
