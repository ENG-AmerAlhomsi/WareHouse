package com.project.warehouse_management_system.BaseClasses;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.NoRepositoryBean;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@NoRepositoryBean
public interface BaseRepo<T, ID> extends JpaRepository<T, ID> {
    @Query("SELECT e FROM #{#entityName} e ORDER BY e.id")
    @Override
    List<T> findAll();
    
    @Query("SELECT e FROM #{#entityName} e WHERE e.id = :id")
    @Override
    Optional<T> findById(@Param("id") ID id);
    
    @Query("SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END FROM #{#entityName} e WHERE e.id = :id")
    @Override
    boolean existsById(@Param("id") ID id);
    
    @Query("SELECT COUNT(e) FROM #{#entityName} e")
    @Override
    long count();
}
