<?php

// autoload_static.php @generated by Composer

namespace Composer\Autoload;

class ComposerStaticInitd751713988987e9331980363e24189ce
{
    public static $prefixLengthsPsr4 = array (
        'B' => 
        array (
            'Bookify\\Models\\' => 15,
            'Bookify\\Controllers\\REST\\' => 25,
            'Bookify\\Controllers\\Admin\\' => 26,
            'Bookify\\Controllers\\' => 20,
            'Bookify\\' => 8,
        ),
    );

    public static $prefixDirsPsr4 = array (
        'Bookify\\Models\\' => 
        array (
            0 => __DIR__ . '/../..' . '/Models',
        ),
        'Bookify\\Controllers\\REST\\' => 
        array (
            0 => __DIR__ . '/../..' . '/Controllers/REST',
        ),
        'Bookify\\Controllers\\Admin\\' => 
        array (
            0 => __DIR__ . '/../..' . '/Controllers/Admin',
        ),
        'Bookify\\Controllers\\' => 
        array (
            0 => __DIR__ . '/../..' . '/Controllers',
        ),
        'Bookify\\' => 
        array (
            0 => '/',
        ),
    );

    public static $classMap = array (
        'Composer\\InstalledVersions' => __DIR__ . '/..' . '/composer/InstalledVersions.php',
    );

    public static function getInitializer(ClassLoader $loader)
    {
        return \Closure::bind(function () use ($loader) {
            $loader->prefixLengthsPsr4 = ComposerStaticInitd751713988987e9331980363e24189ce::$prefixLengthsPsr4;
            $loader->prefixDirsPsr4 = ComposerStaticInitd751713988987e9331980363e24189ce::$prefixDirsPsr4;
            $loader->classMap = ComposerStaticInitd751713988987e9331980363e24189ce::$classMap;

        }, null, ClassLoader::class);
    }
}
