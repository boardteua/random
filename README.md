random chat ratchet test

    composer.phar install
    vendor/bin/phing build
    cd dist
    php -S localhost:8080 -t ./www &
    ./chatserver 8081
