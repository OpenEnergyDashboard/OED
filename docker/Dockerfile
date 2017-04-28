# OED Dockerfile
# Currently only installs PostgreSQL

# BE AWARE: If you change to another base image, you
# may need to enable the apt-get clean in SECTION: INSTALL POSTGRES
FROM postgres:9.6

# ----------------------------
# SECTION: CONFIGURE POSTGRES
# ----------------------------
    # Execute following commands as the user created during postgres 9.3 installation
    USER postgres 
    # Start PostgreSQL and create the 'opened' user/role with password 'opened'
    # Then, create the oed and oed_testing databases.
    RUN /etc/init.d/postgresql start &&\
        psql --command "CREATE USER opened WITH PASSWORD 'opened';" &&\
        createdb -O opened oed &&\
        createdb -O opened oed_testing
    
    # Allow remote connections on all addresses
    RUN echo "host all all 0.0.0.0/0 md5" >> /etc/postgresql/9.6/main/pg_hba.conf
    RUN echo "listen_addresses='*'" >> /etc/postgresql/9.6/main/postgresql.conf

# ----------------------------
# SECTION: CONFIGURE CONTAINER
# ----------------------------
    # Expose the port
    EXPOSE 5432
    
    # Add VOLUMEs to allow backup of config, logs and databases
    VOLUME  ["/etc/postgresql", "/var/log/postgresql", "/var/lib/postgresql"]

    # Set the default command to run when starting the container
    CMD ["/usr/lib/postgresql/9.6/bin/postgres",\
         "-D", "/var/lib/postgresql/9.6/main",\
         "-c", "config_file=/etc/postgresql/9.6/main/postgresql.conf"]
